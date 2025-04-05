import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { jwtVerify } from 'jose';

export async function GET(req: Request) {
  try {
    // Verifiera token
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
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const sql = await getSql();
    
    // Get total token usage per club from daily_statistics
    const tokenUsage = await sql`
      SELECT 
        club_id,
        SUM(total_tokens_used) as total_tokens,
        SUM(total_interactions) as total_interactions,
        MAX(date) as last_activity
      FROM daily_statistics
      GROUP BY club_id
      ORDER BY total_tokens DESC
    `;

    // Get detailed daily usage for the last 30 days
    const dailyUsage = await sql`
      SELECT 
        club_id,
        date,
        total_tokens_used,
        total_interactions
      FROM daily_statistics
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY date DESC, club_id
    `;

    return NextResponse.json({ 
      success: true,
      tokenUsage,
      dailyUsage
    });
  } catch (error) {
    console.error('Error fetching token usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token usage' },
      { status: 500 }
    );
  }
} 