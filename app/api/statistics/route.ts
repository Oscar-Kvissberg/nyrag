import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// Get statistics for a specific club
export async function GET(req: Request) {
  try {
    const { clubId } = await verifyAuth(req);
    const sql = await getSql();

    const stats = await sql`
      SELECT 
        date,
        total_interactions as total_interactions,
        total_tokens_used as total_tokens,
        average_response_time_ms as avg_response_time,
        positive_feedback_count as positive_feedback,
        negative_feedback_count as negative_feedback
      FROM daily_statistics 
      WHERE club_id = ${clubId}
      ORDER BY date DESC
      LIMIT 30
    `;

    return NextResponse.json({ success: true, statistics: stats });
  } catch (error) {
    console.error('Error getting statistics:', error);
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}

// Add new statistics
export async function POST(req: Request) {
  try {
    const { clubId } = await verifyAuth(req);
    const data = await req.json();
    const sql = await getSql();

    await sql`
      INSERT INTO daily_statistics (
        club_id,
        date,
        total_interactions,
        total_tokens_used,
        average_response_time_ms,
        positive_feedback_count,
        negative_feedback_count
      ) VALUES (
        ${clubId},
        ${data.date},
        ${data.total_interactions || 0},
        ${data.total_tokens_used || 0},
        ${data.average_response_time_ms || 0},
        ${data.positive_feedback_count || 0},
        ${data.negative_feedback_count || 0}
      )
      ON CONFLICT (club_id, date) 
      DO UPDATE SET
        total_interactions = EXCLUDED.total_interactions,
        total_tokens_used = EXCLUDED.total_tokens_used,
        average_response_time_ms = EXCLUDED.average_response_time_ms,
        positive_feedback_count = EXCLUDED.positive_feedback_count,
        negative_feedback_count = EXCLUDED.negative_feedback_count
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding statistics:', error);
    return NextResponse.json(
      { error: 'Failed to add statistics' },
      { status: 500 }
    );
  }
}