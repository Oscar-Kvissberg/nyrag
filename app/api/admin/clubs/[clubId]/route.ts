import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function DELETE(
  req: Request,
  { params }: { params: { clubId: string } }
) {
  try {
    // No authentication check needed for this simple implementation
    const { clubId } = params;
    const sql = await getSql();

    // Delete the club
    await sql`
      DELETE FROM users
      WHERE id = ${clubId}
      AND role = 'club'
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting club:', error);
    return NextResponse.json(
      { error: 'Failed to delete club' },
      { status: 500 }
    );
  }
} 