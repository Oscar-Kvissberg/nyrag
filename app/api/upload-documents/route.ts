import { NextResponse } from 'next/server';
import { resetAndUploadDocuments } from '../../utils/searchIndex';
import { documents } from '../../utils/searchIndex';

export async function POST() {
  try {
    const result = await resetAndUploadDocuments(documents);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error uploading documents:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload documents' },
      { status: 500 }
    );
  }
} 