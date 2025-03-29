// This API route is no longer in use since we're using Azure OpenAI directly

import { NextResponse } from 'next/server';
import { resetAndUploadDocuments, listAllDocuments, GolfDocument, documents } from '../../utils/searchIndex';

// First, try to upload all predefined documents
export async function GET() {
  try {
    console.log('Attempting to upload predefined documents...');
    // First try to upload the predefined documents
    const uploadResult = await resetAndUploadDocuments(documents);
    console.log('Upload result:', uploadResult);

    if (!uploadResult.success) {
      return NextResponse.json({ 
        error: 'Failed to upload documents',
        details: uploadResult.message 
      }, { status: 500 });
    }

    // Then list all documents to verify
    const listResult = await listAllDocuments();
    return NextResponse.json({
      upload: uploadResult,
      documents: listResult
    });
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ 
      error: 'Failed to handle request',
      details: String(error)
    }, { status: 500 });
  }
}

// Allow uploading custom documents
export async function POST(req: Request) {
  try {
    const customDocuments = await req.json() as GolfDocument[];
    console.log('Received custom documents:', customDocuments.length);
    
    const result = await resetAndUploadDocuments(customDocuments);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload documents',
        details: String(error)
      },
      { status: 400 }
    );
  }
}

/*
import { NextResponse } from 'next/server';
import { resetAndUploadDocuments, listAllDocuments, GolfDocument } from '../../utils/searchIndex';

export async function GET() {
  const result = await listAllDocuments();
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  try {
    const documents = await req.json() as GolfDocument[];
    const result = await resetAndUploadDocuments(documents);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: String(error) },
      { status: 400 }
    );
  }
}
*/ 