import { NextResponse } from 'next/server';
import sql from 'mssql';

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

// Get all example questions for a specific club
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
        SELECT id, label, text
        FROM example_questions
        WHERE club_id = @clubId
        ORDER BY created_at ASC
      `);

    return NextResponse.json({ examples: result.recordset });
  } catch (error) {
    console.error('Error fetching example questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch example questions' },
      { status: 500 }
    );
  }
}

// Create or update example questions for a specific club
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

    if (!Array.isArray(examples) || !examples.every(ex => 
      typeof ex.label === 'string' && typeof ex.text === 'string'
    )) {
      return NextResponse.json(
        { error: 'Ogiltig datastruktur. Varje exempel måste ha label och text.' },
        { status: 400 }
      );
    }

    pool = await sql.connect(sqlConfig);
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Delete existing examples for this club
    await transaction.request()
      .input('clubId', sql.NVarChar, clubId)
      .query(`
        DELETE FROM example_questions
        WHERE club_id = @clubId
      `);

    // Insert new examples
    for (const example of examples) {
      await transaction.request()
        .input('clubId', sql.NVarChar, clubId)
        .input('label', sql.NVarChar, example.label)
        .input('text', sql.NVarChar, example.text)
        .query(`
          INSERT INTO example_questions (club_id, label, text)
          VALUES (@clubId, @label, @text)
        `);
    }

    await transaction.commit();
    return NextResponse.json({ success: true, examples });
  } catch (error) {
    console.error('Error saving example questions:', error);
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    return NextResponse.json(
      { error: 'Failed to save example questions' },
      { status: 500 }
    );
  } finally {
    if (pool) {
      await pool.close();
    }
  }
} 