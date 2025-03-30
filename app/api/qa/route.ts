import { NextResponse } from 'next/server';
import sql from 'mssql';
import { AzureKeyCredential, SearchClient } from '@azure/search-documents';

// SQL configuration
const sqlConfig = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  server: process.env.AZURE_SQL_SERVER || '',
  database: process.env.AZURE_SQL_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    requestTimeout: 30000, // 30 seconds
    connectionTimeout: 30000, // 30 seconds
  },
};

// Azure Search client
const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT || '',
  'index01',
  new AzureKeyCredential(process.env.AZURE_SEARCH_KEY || '')
);

interface QAExample {
  id: number;
  club_id: string;
  question: string;
  answer: string;
}

// Helper function to sync Q&A with Azure Search
async function syncWithSearch(qa: QAExample) {
  try {
    const searchId = `qa-${qa.id}`;
    
    // Update search_id in database
    const pool = await sql.connect(sqlConfig);
    await pool.request()
      .input('id', sql.Int, qa.id)
      .input('searchId', sql.NVarChar, searchId)
      .query(`
        UPDATE qa_examples
        SET search_id = @searchId
        WHERE id = @id
      `);

    // Upload to Azure Search
    const searchDoc = {
      chunk_id: searchId,
      question: qa.question,
      answer: qa.answer,
      club_id: qa.club_id,
      type: 'email_example'
    };

    await searchClient.uploadDocuments([searchDoc]);
  } catch (error) {
    console.error('Error syncing with search:', error);
    // Don't throw the error, just log it
    // This way, if search sync fails, we still keep the database record
  }
}

// Get all Q&A for a specific club
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('clubId');

    if (!clubId) {
      return NextResponse.json(
        { error: 'clubId is required' },
        { status: 400 }
      );
    }

    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('clubId', sql.NVarChar, clubId)
      .query(`
        SELECT id, question, answer
        FROM qa_examples
        WHERE club_id = @clubId
        ORDER BY created_at DESC
      `);

    return NextResponse.json({ examples: result.recordset });
  } catch (error) {
    console.error('Error fetching Q&A:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Q&A' },
      { status: 500 }
    );
  }
}

// Create or update Q&A for a specific club
export async function POST(req: Request) {
  let pool;
  let transaction;

  try {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('clubId');
    const examples = await req.json();

    if (!clubId) {
      return NextResponse.json(
        { error: 'clubId is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(examples) || !examples.every((example: { question: string; answer: string }) => 
      typeof example.question === 'string' && typeof example.answer === 'string'
    )) {
      return NextResponse.json(
        { error: 'Ogiltig datastruktur. Varje exempel måste ha question och answer.' },
        { status: 400 }
      );
    }

    pool = await sql.connect(sqlConfig);
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Delete existing Q&A for this club
    await transaction.request()
      .input('clubId', sql.NVarChar, clubId)
      .query(`
        DELETE FROM qa_examples
        WHERE club_id = @clubId
      `);

    // Insert new Q&A
    for (const qa of examples) {
      const result = await transaction.request()
        .input('clubId', sql.NVarChar, clubId)
        .input('question', sql.NVarChar, qa.question)
        .input('answer', sql.NVarChar, qa.answer)
        .query(`
          INSERT INTO qa_examples (club_id, question, answer)
          VALUES (@clubId, @question, @answer);
          SELECT SCOPE_IDENTITY() as id;
        `);

      const newQA = {
        id: result.recordset[0].id,
        club_id: clubId,
        question: qa.question,
        answer: qa.answer
      };

      // Sync with Azure Search (non-blocking)
      syncWithSearch(newQA).catch(error => {
        console.error('Error syncing Q&A with search:', error);
      });
    }

    await transaction.commit();
    return NextResponse.json({ success: true, examples });
  } catch (error) {
    console.error('Error saving Q&A:', error);
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    return NextResponse.json(
      { error: 'Failed to save Q&A' },
      { status: 500 }
    );
  } finally {
    if (pool) {
      await pool.close();
    }
  }
} 