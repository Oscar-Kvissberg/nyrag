import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSql } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register new user
export async function POST(req: Request) {
  try {
    const { username, password, clubId } = await req.json();

    if (!username || !password || !clubId) {
      return NextResponse.json(
        { error: 'Username, password and clubId are required' },
        { status: 400 }
      );
    }

    // Get SQL executor
    const sql = await getSql();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Create new user
    await sql`
      INSERT INTO users (username, hashed_password, club_id)
      VALUES (${username}, ${passwordHash}, ${clubId})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}

// Login user
export async function PUT(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Get SQL executor
    const sql = await getSql();

    // Get user
    const users = await sql`
      SELECT * FROM users WHERE username = ${username}
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.hashed_password);
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login time
    await sql`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = ${user.id}
    `;

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        clubId: user.club_id,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({ 
      token,
      user: {
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
  }
} 