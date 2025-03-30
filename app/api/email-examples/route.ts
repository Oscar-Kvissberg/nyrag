import { NextResponse } from 'next/server';
import { AzureKeyCredential, SearchClient } from '@azure/search-documents';

interface EmailExample {
  chunk_id: string;
  question: string;
  answer: string;
  club_id: string;
}

const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT || '',
  'index01',
  new AzureKeyCredential(process.env.AZURE_SEARCH_KEY || '')
);

// Get all email examples for a specific club
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

    console.log('Fetching email examples for club:', clubId);
    const results = await searchClient.search('*', {
      filter: `club_id eq '${clubId}' and type eq 'email_example'`,
      select: ['question', 'answer'],
      top: 100
    });

    const examples = [];
    for await (const result of results.results) {
      const example = result.document as EmailExample;
      examples.push({
        question: example.question,
        answer: example.answer
      });
    }

    console.log('Found examples:', examples.length);
    return NextResponse.json({ examples });
  } catch (error) {
    console.error('Error fetching email examples:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email examples' },
      { status: 500 }
    );
  }
}

// Update email examples for a specific club
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('clubId');
    const newExamples = await req.json();

    if (!clubId) {
      return NextResponse.json(
        { error: 'clubId is required' },
        { status: 400 }
      );
    }

    console.log('Received new examples for club:', clubId);
    
    // Validate the data structure
    if (!Array.isArray(newExamples) || !newExamples.every(example => 
      typeof example.question === 'string' && typeof example.answer === 'string'
    )) {
      return NextResponse.json(
        { error: 'Ogiltig datastruktur. Varje exempel måste ha question och answer.' },
        { status: 400 }
      );
    }

    // First, delete all existing email examples for this club
    console.log('Deleting existing examples...');
    const deleteResults = await searchClient.search('*', {
      filter: `club_id eq '${clubId}' and type eq 'email_example'`,
      select: ['chunk_id'],
      top: 100
    });

    const existingExamples = [];
    for await (const result of deleteResults.results) {
      const example = result.document as EmailExample;
      existingExamples.push({ chunk_id: example.chunk_id });
    }

    if (existingExamples.length > 0) {
      console.log('Found existing examples to delete:', existingExamples);
      await searchClient.deleteDocuments(existingExamples);
    }

    // Then upload the new examples
    console.log('Uploading new examples...');
    const examples = newExamples.map((example, index) => ({
      chunk_id: `${clubId}-email-${index}`,
      question: example.question,
      answer: example.answer,
      club_id: clubId,
      type: 'email_example'
    }));

    console.log('Examples to upload:', examples);
    const uploadResult = await searchClient.uploadDocuments(examples);
    console.log('Upload result:', uploadResult);
    
    return NextResponse.json({ 
      success: true, 
      examples: newExamples 
    });
  } catch (error) {
    console.error('Error saving email examples:', error);
    return NextResponse.json(
      { error: 'Failed to save email examples' },
      { status: 500 }
    );
  }
}

// Update an email example (for feedback)
export async function PUT(req: Request) {
  try {
    const { id, quality, feedback } = await req.json();
    console.log('Received feedback:', { id, quality, feedback });
    
    const example = {
      chunk_id: id,
      title: 'email',
      content: `Feedback: ${quality}\n${feedback || ''}`
    };

    const result = await searchClient.mergeDocuments([example]);
    console.log('Merge result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Feedback added successfully',
      result
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
} 