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

interface Document {
  id: number;
  club_id: string;
  title: string;
  content: string;
  question?: string;  // Optional for QA examples
  answer?: string;    // Optional for QA examples
}

// Helper function to sync document with Azure Search
async function syncWithSearch(document: Document, type: 'document' | 'qa') {
  try {
    const searchId = `${type}-${document.id}`;
    
    // Update search_id in database
    const pool = await sql.connect(sqlConfig);
    await pool.request()
      .input('id', sql.Int, document.id)
      .input('searchId', sql.NVarChar, searchId)
      .query(`
        UPDATE ${type === 'document' ? 'documents' : 'qa_examples'}
        SET search_id = @searchId
        WHERE id = @id
      `);

    // Upload to Azure Search
    const searchDoc = type === 'document' 
      ? {
          chunk_id: searchId,
          title: document.title,
          content: document.content,
          club_id: document.club_id,
          type: 'document'
        }
      : {
          chunk_id: searchId,
          question: document.question,
          answer: document.answer,
          club_id: document.club_id,
          type: 'email_example'
        };

    await searchClient.uploadDocuments([searchDoc]);
  } catch (error) {
    console.error('Error syncing with search:', error);
    // Don't throw the error, just log it
    // This way, if search sync fails, we still keep the database record
  }
}

// Get all documents for a specific club
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
        SELECT id, title, content
        FROM documents
        WHERE club_id = @clubId
        ORDER BY created_at DESC
      `);

    return NextResponse.json({ documents: result.recordset });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// Create or update documents for a specific club
export async function POST(req: Request) {
  let pool;
  let transaction;

  try {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('clubId');
    const documents = await req.json();

    if (!clubId) {
      return NextResponse.json(
        { error: 'clubId is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(documents) || !documents.every(doc => 
      typeof doc.title === 'string' && typeof doc.content === 'string'
    )) {
      return NextResponse.json(
        { error: 'Ogiltig datastruktur. Varje dokument måste ha title och content.' },
        { status: 400 }
      );
    }

    pool = await sql.connect(sqlConfig);
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Delete existing documents for this club
    await transaction.request()
      .input('clubId', sql.NVarChar, clubId)
      .query(`
        DELETE FROM documents
        WHERE club_id = @clubId
      `);

    // Insert new documents
    for (const doc of documents) {
      const result = await transaction.request()
        .input('clubId', sql.NVarChar, clubId)
        .input('title', sql.NVarChar, doc.title)
        .input('content', sql.NVarChar, doc.content)
        .query(`
          INSERT INTO documents (club_id, title, content)
          VALUES (@clubId, @title, @content);
          SELECT SCOPE_IDENTITY() as id;
        `);

      const newDoc = {
        id: result.recordset[0].id,
        club_id: clubId,
        title: doc.title,
        content: doc.content
      };

      // Sync with Azure Search (non-blocking)
      syncWithSearch(newDoc, 'document').catch(error => {
        console.error('Error syncing document with search:', error);
      });
    }

    await transaction.commit();
    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error('Error saving documents:', error);
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    return NextResponse.json(
      { error: 'Failed to save documents' },
      { status: 500 }
    );
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}