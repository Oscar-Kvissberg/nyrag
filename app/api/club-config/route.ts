import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// Get configuration for a specific club
export async function GET(req: Request) {
  try {
    const { clubId } = await verifyAuth(req);
    const sql = await getSql();

    const configs = await sql`
      SELECT * FROM club_config WHERE club_id = ${clubId}
    `;

    if (configs.length === 0) {
      return NextResponse.json({ error: 'No config found' }, { status: 404 });
    }

    return NextResponse.json(configs[0]);
  } catch (error) {
    console.error('Error getting club config:', error);
    return NextResponse.json(
      { error: 'Failed to get club config' },
      { status: 500 }
    );
  }
}

// Update configuration for a specific club
export async function POST(req: Request) {
  try {
    const { clubId } = await verifyAuth(req);
    const data = await req.json();
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
          club_name: data.club_name,
          club_description: data.club_description,
          club_rules: data.club_rules,
          club_context: data.club_context
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
            club_name: data.club_name,
            club_description: data.club_description,
            club_rules: data.club_rules,
            club_context: data.club_context
          })}
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating club config:', error);
    return NextResponse.json(
      { error: 'Failed to update club config' },
      { status: 500 }
    );
  }
} 