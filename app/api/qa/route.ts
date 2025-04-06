import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// Get Q&A examples
export async function GET(req: Request) {
  try {
    const { clubId } = await verifyAuth(req);
    const sql = await getSql();

    const examples = await sql`
      SELECT id, question, answer
      FROM qa_examples
      WHERE club_id = ${clubId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ examples });
  } catch (error) {
    console.error('Error getting Q&A examples:', error);
    return NextResponse.json(
      { error: 'Failed to get Q&A examples' },
      { status: 500 }
    );
  }
}

// Create Q&A example
export async function POST(req: Request) {
  try {
    const { clubId } = await verifyAuth(req);
    const examples = await req.json();
    const sql = await getSql();

    // First, delete all existing QA examples for this club
    await sql`
      DELETE FROM qa_examples
      WHERE club_id = ${clubId}
    `;

    // Insert all examples
    for (const { question, answer } of examples) {
      if (!question || !answer) {
        throw new Error('Question and answer are required for each example');
      }
      
      await sql`
        INSERT INTO qa_examples (
          club_id,
          question,
          answer,
          created_at
        ) VALUES (
          ${clubId},
          ${question},
          ${answer},
          CURRENT_TIMESTAMP
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating Q&A examples:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create Q&A examples' },
      { status: 500 }
    );
  }
} 