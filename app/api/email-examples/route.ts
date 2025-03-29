import { NextResponse } from 'next/server';
import { AzureKeyCredential, SearchClient } from '@azure/search-documents';
import { EmailExample } from '@/app/utils/searchIndex';

const emailSearchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT!,
  'email-examples',
  new AzureKeyCredential(process.env.AZURE_SEARCH_KEY!)
);

// Get all email examples
export async function GET() {
  try {
    const results = await emailSearchClient.search<EmailExample>('*', {
      top: 1000,
      select: ['id', 'email', 'response', 'category', 'quality', 'feedback', 'timestamp'],
      orderBy: ['timestamp desc']
    });

    const examples = [];
    for await (const result of results.results) {
      examples.push(result.document);
    }

    return NextResponse.json({
      success: true,
      examples,
      count: examples.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// Add a new email example
export async function POST(req: Request) {
  try {
    const example = await req.json() as EmailExample;
    
    // Add timestamp if not provided
    if (!example.timestamp) {
      example.timestamp = new Date().toISOString();
    }
    
    // Add ID if not provided
    if (!example.id) {
      example.id = `email-${Date.now()}`;
    }

    // Set initial quality if not provided
    if (!example.quality) {
      example.quality = 'unknown';
    }

    const result = await emailSearchClient.uploadDocuments([example]);
    
    return NextResponse.json({
      success: true,
      message: 'Email example added successfully',
      result
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// Update an email example (for feedback)
export async function PUT(req: Request) {
  try {
    const { id, quality, feedback } = await req.json();
    
    const example = {
      id,
      quality,
      feedback,
      timestamp: new Date().toISOString()
    };

    const result = await emailSearchClient.mergeDocuments([example]);
    
    return NextResponse.json({
      success: true,
      message: 'Feedback added successfully',
      result
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
} 