import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// Get statistics for a specific club
export async function GET(req: Request) {
  try {
    const { clubId } = await verifyAuth(req);
    const sql = await getSql();

    // First, aggregate today's interactions
    await sql`
      INSERT INTO daily_statistics (
        club_id,
        date,
        total_interactions,
        total_tokens_used
      )
      SELECT 
        club_id,
        DATE(timestamp) as date,
        COUNT(*) as total_interactions,
        SUM(tokens_used) as total_tokens_used
      FROM user_interactions
      WHERE club_id = ${clubId}
        AND DATE(timestamp) = CURRENT_DATE
      GROUP BY club_id, DATE(timestamp)
      ON CONFLICT (club_id, date)
      DO UPDATE SET
        total_interactions = EXCLUDED.total_interactions,
        total_tokens_used = EXCLUDED.total_tokens_used
    `;

    // Get daily statistics
    const dailyStats = await sql`
      SELECT 
        date,
        total_interactions,
        total_tokens_used as total_tokens
      FROM daily_statistics 
      WHERE club_id = ${clubId}
      ORDER BY date DESC
      LIMIT 30
    `;

    // Get category statistics
    const categoryStats = await sql`
      SELECT 
        category,
        COUNT(*) as count
      FROM user_interactions
      WHERE club_id = ${clubId}
        AND category IS NOT NULL
      GROUP BY category
    `;

    return NextResponse.json({ 
      success: true, 
      statistics: dailyStats,
      categories: categoryStats
    });
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
        total_tokens_used
      ) VALUES (
        ${clubId},
        ${data.date},
        ${data.total_interactions || 0},
        ${data.total_tokens_used || 0}
      )
      ON CONFLICT (club_id, date) 
      DO UPDATE SET
        total_interactions = EXCLUDED.total_interactions,
        total_tokens_used = EXCLUDED.total_tokens_used
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