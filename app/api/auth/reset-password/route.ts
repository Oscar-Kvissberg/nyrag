import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSql } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { username, newPassword } = await req.json();

    if (!username || !newPassword) {
      return NextResponse.json(
        { error: 'Username and new password are required' },
        { status: 400 }
      );
    }

    // Get SQL executor
    const sql = await getSql();

    // Check if user exists
    const users = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await sql`
      UPDATE users 
      SET hashed_password = ${hashedPassword}
      WHERE username = ${username}
    `;

    return NextResponse.json({ 
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
} 