import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// Get QA examples for a specific club
export async function GET(req: Request) {
  try {
    const { clubId } = await verifyAuth(req);
    const sql = await getSql();

    const examples = await sql`
      SELECT * FROM qa_examples 
      WHERE club_id = ${clubId}
      ORDER BY created_at DESC
    `;
    

    return NextResponse.json(examples);
  } catch (error) {
    console.error('Error getting QA examples:', error);
    return NextResponse.json(
      { error: 'Failed to get QA examples' },
      { status: 500 }
    );
  }
}


// Create a new QA example
export async function POST(req: Request) {
  try {
    const { clubId } = await verifyAuth(req);
    const { question, answer } = await req.json();
    const sql = await getSql();

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating QA example:', error);
    return NextResponse.json(
      { error: 'Failed to create QA example' },
      { status: 500 }
    );
  }
}

// Delete a QA example
export async function DELETE(req: Request) {
  try {
    const { clubId } = await verifyAuth(req);
    const { id } = await req.json();
    const sql = await getSql();

    await sql`
      DELETE FROM qa_examples 
      WHERE id = ${id} AND club_id = ${clubId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting QA example:', error);
    return NextResponse.json(
      { error: 'Failed to delete QA example' },
      { status: 500 }
    );
  }
} 