import { NextResponse } from 'next/server';
import { createSearchIndex } from '@/lib/create-search-index';

export async function POST() {
  try {
    const result = await createSearchIndex();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating index:', error);
    return NextResponse.json(
      { error: 'Failed to create index' },
      { status: 500 }
    );
  }
} 