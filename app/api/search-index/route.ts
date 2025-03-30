// This API route is no longer in use since we're using Azure OpenAI directly

import { NextResponse } from 'next/server';
import { AzureKeyCredential, SearchClient } from '@azure/search-documents';

interface SearchDocument {
  chunk_id: string;
  title: string;
  content: string;
  club_id: string;
}

const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT || '',
  'index01',
  new AzureKeyCredential(process.env.AZURE_SEARCH_KEY || '')
);

// Predefined documents that should always be in the index
const predefinedDocuments: SearchDocument[] = [
  {
    chunk_id: "faq-1",
    title: "Vanliga frågor och svar",
    content: "För att underlätta för våra medlemmar och gäster har vi här sammanställt de vanligaste frågorna samt svar.",
    club_id: "club1"
  },
  {
    chunk_id: "faq-2",
    title: "Medlemskap 2025",
    content: "Jag är intresserad av medlemskap 2025. Hur går jag tillväga? Klicka på denna url https://vasatorp.golf/medlemskap/ för att hitta information gällande medlemskap. Längst ned på sidan kan du sedan skicka in din ansökan. Du är välkommen att maila övriga frågor till kansli@vasatorp.golf.",
    club_id: "club1"
  },
  // ... add more predefined documents here
];

// Function to ensure predefined documents are in the index
async function ensurePredefinedDocuments() {
  try {
    // First, check if we have any documents
    const results = await searchClient.search('*', {
      select: ['chunk_id'],
      top: 1
    });

    let hasDocuments = false;
    for await (const doc of results.results) {
      if (doc.document) {
        hasDocuments = true;
        break;
      }
    }

    // If no documents exist, upload the predefined ones
    if (!hasDocuments) {
      console.log('No documents found, uploading predefined documents...');
      await searchClient.uploadDocuments(predefinedDocuments);
      console.log('Predefined documents uploaded successfully');
    }
  } catch (error) {
    console.error('Error ensuring predefined documents:', error);
  }
}

// Call this when the server starts
ensurePredefinedDocuments();

// Get all documents for a specific club
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

    console.log('Fetching documents for club:', clubId);
    const results = await searchClient.search('*', {
      filter: `club_id eq '${clubId}'`,
      select: ['title', 'content'],
      top: 100
    });

    const documents = [];
    for await (const result of results.results) {
      const doc = result.document as SearchDocument;
      documents.push({
        title: doc.title,
        content: doc.content
      });
    }

    console.log('Found documents:', documents.length);
    return NextResponse.json({ documents: { documents } });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// Update documents for a specific club
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('clubId');
    const newDocuments = await req.json();

    if (!clubId) {
      return NextResponse.json(
        { error: 'clubId is required' },
        { status: 400 }
      );
    }

    console.log('Received new documents for club:', clubId);
    
    // Validate the data structure
    if (!Array.isArray(newDocuments) || !newDocuments.every(doc => 
      typeof doc.title === 'string' && typeof doc.content === 'string'
    )) {
      return NextResponse.json(
        { error: 'Ogiltig datastruktur. Varje dokument måste ha title och content.' },
        { status: 400 }
      );
    }

    // First, delete all existing documents for this club
    console.log('Deleting existing documents...');
    const deleteResults = await searchClient.search('*', {
      filter: `club_id eq '${clubId}'`,
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

    // Then upload the new documents
    console.log('Uploading new documents...');
    const documents = newDocuments.map((doc, index) => ({
      chunk_id: `${clubId}-doc-${index}`,
      title: doc.title,
      content: doc.content,
      club_id: clubId
    }));

    console.log('Documents to upload:', documents);
    const uploadResult = await searchClient.uploadDocuments(documents);
    console.log('Upload result:', uploadResult);
    
    return NextResponse.json({ 
      success: true, 
      documents: { documents: newDocuments } 
    });
  } catch (error) {
    console.error('Error saving documents:', error);
    return NextResponse.json(
      { error: 'Failed to save documents' },
      { status: 500 }
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