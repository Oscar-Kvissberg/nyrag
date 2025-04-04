import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// Get example questions
export async function GET(req: Request) {
  try {
    const { clubId } = await verifyAuth(req);
    const sql = await getSql();

    const examples = await sql`
      SELECT id, label, text
      FROM example_questions
      WHERE club_id = ${clubId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ examples });
  } catch (error) {
    console.error('Error getting example questions:', error);
    return NextResponse.json(
      { error: 'Failed to get example questions' },
      { status: 500 }
    );
  }
}

// Create example question
export async function POST(req: Request) {
  try {
    const { clubId } = await verifyAuth(req);
    const examples = await req.json();
    const sql = await getSql();

    // Insert all example questions
    for (const { label, text } of examples) {
      if (!label || !text) {
        throw new Error('Label and text are required for each example question');
      }
      
      await sql`
        INSERT INTO example_questions (
          club_id,
          label,
          text,
          created_at
        ) VALUES (
          ${clubId},
          ${label},
          ${text},
          CURRENT_TIMESTAMP
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating example questions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create example questions' },
      { status: 500 }
    );
  }
} 