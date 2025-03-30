import { NextResponse } from 'next/server';
import sql from 'mssql';

const sqlConfig = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  server: process.env.AZURE_SQL_SERVER || '',
  database: process.env.AZURE_SQL_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

export async function POST() {
  let pool = null;
  try {
    pool = await sql.connect(sqlConfig);
    
    // Drop the users table if it exists
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
      BEGIN
        DROP TABLE users;
      END
    `);

    // Create the users table with username
    await pool.request().query(`
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(255) UNIQUE NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        club_id NVARCHAR(100) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'user',
        created_at DATETIME2 DEFAULT GETDATE(),
        last_login DATETIME2
      );
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting users table:', error);
    return NextResponse.json(
      { error: 'Failed to reset users table' },
      { status: 500 }
    );
  } finally {
    if (pool) {
      await pool.close();
    }
  }
} 