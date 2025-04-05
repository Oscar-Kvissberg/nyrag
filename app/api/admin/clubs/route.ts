import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Get all clubs
export async function GET(req: Request) {
  try {
    // No authentication check needed for this simple implementation
    const sql = await getSql();
    const clubs = await sql`
      SELECT 
        id,
        name,
        tokens_used,
        created_at
      FROM users
      WHERE role = 'club'
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ clubs });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clubs' },
      { status: 500 }
    );
  }
}

// Add a new club
export async function POST(req: Request) {
  try {
    // No authentication check needed for this simple implementation
    const { name, password } = await req.json();

    if (!name || !password) {
      return NextResponse.json(
        { error: 'Name and password are required' },
        { status: 400 }
      );
    }

    const sql = await getSql();

    // Check if club already exists
    const existingClub = await sql`
      SELECT id FROM users WHERE name = ${name}
    `;

    if (existingClub.length > 0) {
      return NextResponse.json(
        { error: 'Club already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new club
    const result = await sql`
      INSERT INTO users (
        name,
        password,
        role,
        tokens_used
      ) VALUES (
        ${name},
        ${hashedPassword},
        'club',
        0
      ) RETURNING id
    `;

    return NextResponse.json({
      success: true,
      clubId: result[0].id
    });
  } catch (error) {
    console.error('Error creating club:', error);
    return NextResponse.json(
      { error: 'Failed to create club' },
      { status: 500 }
    );
  }
} 