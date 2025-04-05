import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const sql = await getSql();

    // Check if admin already exists
    const existingAdmin = await sql`
      SELECT id FROM users WHERE role = 'admin'
    `;

    if (existingAdmin.length > 0) {
      return NextResponse.json(
        { error: 'Admin user already exists' },
        { status: 400 }
      );
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await sql`
      INSERT INTO users (
        name,
        password,
        role,
        tokens_used
      ) VALUES (
        'admin',
        ${hashedPassword},
        'admin',
        0
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      credentials: {
        username: 'admin',
        password: 'admin123'
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
} 