import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { jwtVerify } from 'jose';

export async function POST(req: Request) {
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

    const { clubId, clubName, clubDescription, clubRules, clubContext } = await req.json();
    
    if (!clubId) {
      return NextResponse.json(
        { error: 'Club ID is required' },
        { status: 400 }
      );
    }

    const sql = await getSql();
    
    // Check if config already exists
    const existingConfigs = await sql`
      SELECT club_id FROM club_config WHERE club_id = ${clubId}
    `;

    if (existingConfigs.length > 0) {
      // Update existing config
      await sql`
        UPDATE club_config 
        SET config = ${JSON.stringify({
          club_name: clubName || 'Golfklubb',
          club_description: clubDescription || '',
          club_rules: clubRules || '',
          club_context: clubContext || ''
        })}
        WHERE club_id = ${clubId}
      `;
    } else {
      // Create new config
      await sql`
        INSERT INTO club_config (
          club_id, 
          config
        ) VALUES (
          ${clubId},
          ${JSON.stringify({
            club_name: clubName || 'Golfklubb',
            club_description: clubDescription || '',
            club_rules: clubRules || '',
            club_context: clubContext || ''
          })}
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding club config:', error);
    return NextResponse.json(
      { error: 'Failed to add club config' },
      { status: 500 }
    );
  }
} 