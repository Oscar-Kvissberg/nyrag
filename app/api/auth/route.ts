import { NextResponse } from 'next/server';
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

// Function to ensure users table exists
async function ensureUsersTable() {
  let pool = null;
  try {
    pool = await sql.connect(sqlConfig);
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
      BEGIN
        CREATE TABLE users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          username NVARCHAR(255) UNIQUE NOT NULL,
          hashed_password NVARCHAR(255) NOT NULL,
          club_id NVARCHAR(100) NOT NULL,
          role NVARCHAR(50) NOT NULL DEFAULT 'user',
          created_at DATETIME2 DEFAULT GETDATE(),
          last_login DATETIME2
        );
      END
    `);
  } catch (error) {
    console.error('Error ensuring users table:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Register new user
export async function POST(req: Request) {
  let pool = null;
  try {
    const { username, password, clubId } = await req.json();

    if (!username || !password || !clubId) {
      return NextResponse.json(
        { error: 'Username, password and clubId are required' },
        { status: 400 }
      );
    }

    // Ensure users table exists
    await ensureUsersTable();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    pool = await sql.connect(sqlConfig);
    
    // Check if user already exists
    const existingUser = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT id FROM users WHERE username = @username');

    if (existingUser.recordset.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Create new user
    await pool.request()
      .input('username', sql.NVarChar, username)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('clubId', sql.NVarChar, clubId)
      .query(`
        INSERT INTO users (username, hashed_password, club_id)
        VALUES (@username, @passwordHash, @clubId)
      `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Login user
export async function PUT(req: Request) {
  let pool = null;
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Ensure users table exists
    await ensureUsersTable();

    pool = await sql.connect(sqlConfig);
    
    // Get user
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM users WHERE username = @username');

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = result.recordset[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.hashed_password);
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        clubId: user.club_id,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({ 
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        clubId: user.club_id,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json(
      { error: 'Failed to log in' },
      { status: 500 }
    );
  } finally {
    if (pool) {
      await pool.close();
    }
  }
} 