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
    connectTimeout: 30000, // 30 seconds
    requestTimeout: 30000, // 30 seconds
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  },
};

// Function to get a database connection
async function getConnection() {
  try {
    const pool = await sql.connect(sqlConfig);
    return pool;
  } catch (err) {
    console.error('Failed to connect to database:', err);
    throw new Error('Database connection failed');
  }
}

// Function to ensure required tables exist
async function ensureTables() {
  let pool = null;
  try {
    pool = await getConnection();

    // Create table for storing daily statistics if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'daily_statistics')
      BEGIN
        CREATE TABLE daily_statistics (
          date DATE PRIMARY KEY,
          total_interactions INT DEFAULT 0,
          total_tokens_used INT DEFAULT 0,
          average_response_time_ms FLOAT DEFAULT 0,
          positive_feedback_count INT DEFAULT 0,
          negative_feedback_count INT DEFAULT 0
        );
      END

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_interactions')
      BEGIN
        CREATE TABLE user_interactions (
          id INT IDENTITY(1,1) PRIMARY KEY,
          timestamp DATETIME2 DEFAULT GETDATE(),
          club_id NVARCHAR(100),
          interaction_type NVARCHAR(50),
          question NVARCHAR(MAX),
          answer NVARCHAR(MAX),
          feedback NVARCHAR(50),
          feedback_text NVARCHAR(MAX),
          response_time_ms INT,
          tokens_used INT
        );
      END

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
      BEGIN
        CREATE TABLE users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          username NVARCHAR(255) UNIQUE NOT NULL,
          password_hash NVARCHAR(255) NOT NULL,
          club_id NVARCHAR(100) NOT NULL,
          role NVARCHAR(50) NOT NULL DEFAULT 'user',
          created_at DATETIME2 DEFAULT GETDATE(),
          last_login DATETIME2
        );
      END
    `);
  } catch (error) {
    console.error('Error ensuring tables:', error);
    throw error;
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

export async function GET(req: Request) {
  let pool = null;
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const clubId = searchParams.get('clubId');

    if (!clubId) {
      return NextResponse.json(
        { error: 'clubId is required' },
        { status: 400 }
      );
    }

    // Ensure tables exist
    await ensureTables();

    // Create a new connection for the query
    pool = await getConnection();
    
    let query = `
      SELECT 
        CAST(date AS VARCHAR) as date,
        total_interactions,
        total_tokens_used as total_tokens,
        average_response_time_ms as avg_response_time,
        positive_feedback_count as positive_feedback,
        negative_feedback_count as negative_feedback
      FROM daily_statistics ds
      INNER JOIN user_interactions ui ON CAST(ui.timestamp AS DATE) = ds.date
      WHERE ui.club_id = @clubId
    `;

    if (startDate) {
      query += ` AND ds.date >= @startDate`;
    }
    if (endDate) {
      query += ` AND ds.date <= @endDate`;
    }

    query += ` GROUP BY ds.date, total_interactions, total_tokens_used, average_response_time_ms, positive_feedback_count, negative_feedback_count ORDER BY ds.date DESC`;

    const request = pool.request();
    request.input('clubId', sql.NVarChar, clubId);
    if (startDate) request.input('startDate', sql.Date, new Date(startDate));
    if (endDate) request.input('endDate', sql.Date, new Date(endDate));

    const result = await request.query(query);

    return NextResponse.json({
      success: true,
      statistics: result.recordset
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: String(error) },
      { status: 500 }
    );
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

export async function POST(req: Request) {
  let pool = null;
  try {
    const { clubId, interactionType, question, answer, feedback, feedbackText, responseTimeMs, tokensUsed } = await req.json();

    if (!clubId || !interactionType) {
      return NextResponse.json(
        { error: 'clubId and interactionType are required' },
        { status: 400 }
      );
    }

    // Ensure tables exist
    await ensureTables();

    // Create a new connection for the query
    pool = await getConnection();
    
    // Insert interaction
    await pool.request()
      .input('clubId', sql.NVarChar, clubId)
      .input('interactionType', sql.NVarChar, interactionType)
      .input('question', sql.NVarChar, question)
      .input('answer', sql.NVarChar, answer)
      .input('feedback', sql.NVarChar, feedback)
      .input('feedbackText', sql.NVarChar, feedbackText)
      .input('responseTimeMs', sql.Int, responseTimeMs || 0)
      .input('tokensUsed', sql.Int, tokensUsed || 0)
      .query(`
        INSERT INTO user_interactions 
        (club_id, interaction_type, question, answer, feedback, feedback_text, response_time_ms, tokens_used)
        VALUES 
        (@clubId, @interactionType, @question, @answer, @feedback, @feedbackText, @responseTimeMs, @tokensUsed)
      `);

    // Update daily statistics
    const today = new Date().toISOString().split('T')[0];
    await pool.request()
      .input('date', sql.Date, today)
      .query(`
        MERGE daily_statistics AS target
        USING (
          SELECT 
            @date as date,
            COUNT(*) as total_interactions,
            SUM(tokens_used) as total_tokens,
            AVG(response_time_ms) as avg_response_time,
            SUM(CASE WHEN feedback = 'good' THEN 1 ELSE 0 END) as positive_feedback,
            SUM(CASE WHEN feedback = 'bad' THEN 1 ELSE 0 END) as negative_feedback
          FROM user_interactions
          WHERE CAST(timestamp AS DATE) = @date
        ) AS source
        ON target.date = source.date
        WHEN MATCHED THEN
          UPDATE SET
            total_interactions = source.total_interactions,
            total_tokens_used = source.total_tokens,
            average_response_time_ms = source.avg_response_time,
            positive_feedback_count = source.positive_feedback,
            negative_feedback_count = source.negative_feedback
        WHEN NOT MATCHED THEN
          INSERT (date, total_interactions, total_tokens_used, average_response_time_ms, positive_feedback_count, negative_feedback_count)
          VALUES (source.date, source.total_interactions, source.total_tokens, source.avg_response_time, source.positive_feedback, source.negative_feedback);
      `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving statistics:', error);
    return NextResponse.json(
      { error: 'Failed to save statistics', details: String(error) },
      { status: 500 }
    );
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
} 