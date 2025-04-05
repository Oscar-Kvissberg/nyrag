import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.pathname.split('/').pop();
    const sql = await getSql();
    
    // Delete user
    await sql`
      DELETE FROM users
      WHERE id = ${userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 