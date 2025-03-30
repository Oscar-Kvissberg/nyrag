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
    requestTimeout: 30000,
    connectionTimeout: 30000,
  },
};

export async function POST() {
  try {
    const pool = await sql.connect(sqlConfig);

    // Create example_questions table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[example_questions]') AND type in (N'U'))
      BEGIN
        CREATE TABLE example_questions (
          id INT IDENTITY(1,1) PRIMARY KEY,
          club_id NVARCHAR(50) NOT NULL,
          label NVARCHAR(255) NOT NULL,
          text NVARCHAR(MAX) NOT NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        )
      END
    `);

    await pool.close();

    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize database' 
      },
      { status: 500 }
    );
  }
} 