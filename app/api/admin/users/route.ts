import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Get all users
export async function GET() {
  try {
    const sql = await getSql();
    
    // Get users with their token usage
    const users = await sql`
      SELECT 
        u.id, 
        u.username, 
        u.club_id, 
        u.role, 
        u.created_at,
        u.tokens_used
      FROM users u
      ORDER BY u.created_at DESC
    `;

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// Create a new user
export async function POST(req: Request) {
  try {
    const { username, password, clubId, role } = await req.json();
    const sql = await getSql();

    // Check if username already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Användarnamnet är redan taget' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await sql`
      INSERT INTO users (
        username,
        hashed_password,
        club_id,
        role,
        tokens_used
      ) VALUES (
        ${username},
        ${hashedPassword},
        ${clubId},
        ${role},
        0
      ) RETURNING id, username, club_id, role, created_at, tokens_used
    `;

    // Check if club configuration exists
    const existingConfig = await sql`
      SELECT club_id FROM club_config WHERE club_id = ${clubId}
    `;

    // If no club configuration exists, create a default one
    if (existingConfig.length === 0) {
      console.log(`Creating default club configuration for ${clubId}`);
      await sql`
        INSERT INTO club_config (
          club_id, 
          config
        ) VALUES (
          ${clubId},
          ${JSON.stringify({
            club_name: `${clubId} Golfklubb`,
            club_description: '',
            club_rules: '',
            club_context: ''
          })}
        )
      `;
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 