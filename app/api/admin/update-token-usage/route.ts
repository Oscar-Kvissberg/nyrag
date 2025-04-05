import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { jwtVerify } from 'jose';

export async function GET(req: Request) {
  try {
    // Verify admin token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key');
    
    try {
      await jwtVerify(token, secret);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const sql = await getSql();
    
    // Force recreate the users table with the tokens_used column
    try {
      // First, backup existing users
      const existingUsers = await sql`
        SELECT id, username, hashed_password, club_id, role, created_at, last_login
        FROM users
      `;
      
      // Drop and recreate the users table
      await sql`DROP TABLE IF EXISTS users`;
      await sql`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          hashed_password VARCHAR(255) NOT NULL,
          club_id VARCHAR(100) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP WITH TIME ZONE,
          tokens_used INTEGER DEFAULT 0
        )
      `;
      
      // Restore users with their data
      for (const user of existingUsers) {
        await sql`
          INSERT INTO users (id, username, hashed_password, club_id, role, created_at, last_login)
          VALUES (${user.id}, ${user.username}, ${user.hashed_password}, ${user.club_id}, ${user.role}, ${user.created_at}, ${user.last_login})
        `;
      }
      
      console.log('Recreated users table with tokens_used column');
    } catch (error) {
      console.error('Error recreating users table:', error);
      return NextResponse.json(
        { error: 'Failed to recreate users table' },
        { status: 500 }
      );
    }
    
    // Update all users with their token usage data
    const result = await sql`
      UPDATE users u
      SET tokens_used = (
        SELECT COALESCE(SUM(total_tokens_used), 0)
        FROM daily_statistics ds
        WHERE ds.club_id = u.club_id
      )
      RETURNING id, username, club_id, tokens_used
    `;

    return NextResponse.json({ 
      success: true,
      updatedUsers: result
    });
  } catch (error) {
    console.error('Error updating token usage:', error);
    return NextResponse.json(
      { error: 'Failed to update token usage' },
      { status: 500 }
    );
  }
} 