import { NextResponse } from 'next/server';
import sql from 'mssql';
import bcrypt from 'bcryptjs';

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
    enableArithAbort: true,
    pool: false
  },
};

export async function GET() {
  console.log('Starting auth test...');
  
  try {
    // Connect to database
    console.log('Connecting to database...');
    const pool = await sql.connect(sqlConfig);
    
    // Check if users table exists
    console.log('Checking users table...');
    const tableResult = await pool.request().query(`
      SELECT OBJECT_ID('users') as tableId
    `);
    
    const hasUsersTable = tableResult.recordset[0].tableId !== null;
    
    if (!hasUsersTable) {
      console.log('Creating users table...');
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
    }

    // Check if admin user exists
    console.log('Checking admin user...');
    const userResult = await pool.request()
      .input('username', sql.NVarChar, 'admin')
      .query('SELECT id FROM users WHERE username = @username');

    const hasAdminUser = userResult.recordset.length > 0;

    if (!hasAdminUser) {
      console.log('Creating admin user...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      
      await pool.request()
        .input('username', sql.NVarChar, 'admin')
        .input('passwordHash', sql.NVarChar, passwordHash)
        .input('clubId', sql.NVarChar, 'vasatorp')
        .query(`
          INSERT INTO users (username, password_hash, club_id, role)
          VALUES (@username, @passwordHash, @clubId, 'admin')
        `);
    }

    // Get all users
    console.log('Fetching all users...');
    const allUsers = await pool.request().query(`
      SELECT id, username, club_id, role, created_at, last_login 
      FROM users
    `);

    await pool.close();

    return NextResponse.json({ 
      success: true,
      hasUsersTable,
      hasAdminUser,
      users: allUsers.recordset,
      jwtSecret: !!process.env.JWT_SECRET
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 