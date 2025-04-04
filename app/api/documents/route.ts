import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// Get documents for a specific club
export async function GET(req: Request) {
  try {
    const auth = await verifyAuth(req);
    const sql = await getSql();

    const documents = await sql`
      SELECT * FROM documents 
      WHERE club_id = ${auth.clubId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error getting documents:', error);
    return NextResponse.json(
      { error: 'Failed to get documents' },
      { status: 500 }
    );
  }
}

// Create a new document
export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    const documents = await req.json();
    const sql = await getSql();

    // Delete all existing documents for this club
    await sql`
      DELETE FROM documents 
      WHERE club_id = ${auth.clubId}
    `;

    // Insert all documents
    for (const { title, content } of documents) {
      await sql`
        INSERT INTO documents (
          club_id,
          title,
          content,
          created_at
        ) VALUES (
          ${auth.clubId},
          ${title},
          ${content},
          CURRENT_TIMESTAMP
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating documents:', error);
    return NextResponse.json(
      { error: 'Failed to create documents' },
      { status: 500 }
    );
  }
}

// Delete a document
export async function DELETE(req: Request) {
  try {
    const auth = await verifyAuth(req);
    const { id } = await req.json();
    const sql = await getSql();

    await sql`
      DELETE FROM documents 
      WHERE id = ${id} AND club_id = ${auth.clubId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}