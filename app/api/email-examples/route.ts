import { NextResponse } from 'next/server';
import { AzureKeyCredential, SearchClient } from '@azure/search-documents';

interface SearchDocument {
  chunk_id: string;
  title: string;
  content: string;
}

const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT || '',
  'index01',
  new AzureKeyCredential(process.env.AZURE_SEARCH_KEY || '')
);

// Get all email examples
export async function GET() {
  try {
    console.log('Fetching email examples...');
    const results = await searchClient.search('*', {
      filter: "title eq 'email'",
      select: ['title', 'content'],
      top: 100
    });

    const examples = [];
    for await (const result of results.results) {
      const doc = result.document as SearchDocument;
      console.log('Found document:', doc);
      // Split content into question and answer
      const [question, answer] = doc.content.split('\n\n');
      examples.push({ question, answer });
    }

    console.log('Found examples:', examples);
    return NextResponse.json({ examples });
  } catch (error) {
    console.error('Error fetching examples:', error);
    return NextResponse.json(
      { error: 'Failed to fetch examples' },
      { status: 500 }
    );
  }
}

// Update email examples
export async function POST(req: Request) {
  try {
    const newExamples = await req.json();
    console.log('Received new examples:', newExamples);
    
    // Validate the data structure
    if (!Array.isArray(newExamples) || !newExamples.every(email => 
      typeof email.question === 'string' && typeof email.answer === 'string'
    )) {
      return NextResponse.json(
        { error: 'Ogiltig datastruktur. Varje exempel måste ha question och answer.' },
        { status: 400 }
      );
    }

    // First, delete all existing email examples
    console.log('Deleting existing examples...');
    const deleteResults = await searchClient.search('*', {
      filter: "title eq 'email'",
      select: ['chunk_id'],
      top: 100
    });

    const existingDocs = [];
    for await (const result of deleteResults.results) {
      const doc = result.document as SearchDocument;
      existingDocs.push({ chunk_id: doc.chunk_id });
    }

    if (existingDocs.length > 0) {
      console.log('Found existing docs to delete:', existingDocs);
      await searchClient.deleteDocuments(existingDocs);
    }

    // Then upload the new examples
    console.log('Uploading new examples...');
    const documents = newExamples.map((example, index) => ({
      chunk_id: `email-${index}`,
      title: 'email',
      content: `${example.question}\n\n${example.answer}`
    }));

    console.log('Documents to upload:', documents);
    const uploadResult = await searchClient.uploadDocuments(documents);
    console.log('Upload result:', uploadResult);
    
    return NextResponse.json({ 
      success: true, 
      examples: newExamples 
    });
  } catch (error) {
    console.error('Error saving examples:', error);
    return NextResponse.json(
      { error: 'Failed to save examples' },
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