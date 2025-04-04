import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { syncDocuments, syncQAExamples } from '@/lib/sync-search';

export async function POST(req: Request) {
  try {
    const { clubId } = await verifyAuth(req);

    // Sync both documents and QA examples
    const [docsResult, qaResult] = await Promise.all([
      syncDocuments(clubId),
      syncQAExamples(clubId)
    ]);

    return NextResponse.json({
      success: true,
      documents: docsResult,
      qaExamples: qaResult
    });
  } catch (error) {
    console.error('Error syncing to search:', error);
    return NextResponse.json(
      { error: 'Failed to sync to search' },
      { status: 500 }
    );
  }
} 