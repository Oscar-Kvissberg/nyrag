import { NextResponse } from 'next/server';
import { syncAllData } from '@/lib/sync-search';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('clubId');

    if (!clubId) {
      return NextResponse.json(
        { error: 'clubId is required' },
        { status: 400 }
      );
    }

    console.log('Starting sync for club:', clubId);
    const result = await syncAllData(clubId);
    console.log('Sync completed:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in test-sync:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
} 