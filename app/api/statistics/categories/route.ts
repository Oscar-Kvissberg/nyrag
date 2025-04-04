import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// Get category statistics for a specific club
export async function GET(req: Request) {
  try {
    const { clubId } = await verifyAuth(req);
    const sql = await getSql();

    const stats = await sql`
      SELECT * FROM user_interactions 
      WHERE club_id = ${clubId}
      ORDER BY timestamp DESC
      LIMIT 100
    `;

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting category statistics:', error);
    return NextResponse.json(
      { error: 'Failed to get category statistics' },
      { status: 500 }
    );
  }
}

// Add new category interaction
export async function POST(req: Request) {
  try {
    const { clubId } = await verifyAuth(req);
    const data = await req.json();
    const sql = await getSql();

    await sql`
      INSERT INTO user_interactions (
        club_id,
        user_id,
        category,
        timestamp
      ) VALUES (
        ${clubId},
        ${data.user_id},
        ${data.category},
        CURRENT_TIMESTAMP
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding category interaction:', error);
    return NextResponse.json(
      { error: 'Failed to add category interaction' },
      { status: 500 }
    );
  }
} 