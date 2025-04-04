import { getSql } from '@/lib/db';
import { AzureKeyCredential, SearchClient } from '@azure/search-documents';

interface Document {
  id: number;
  title: string;
  content: string;
  club_id: string;
  created_at: Date;
}

interface QAExample {
  id: number;
  question: string;
  answer: string;
  club_id: string;
  created_at: Date;
}

interface SearchDocument {
  id: string;
  title: string;
  content: string;
  club_id: string;
  type: string;
}

interface SearchQAExample extends SearchDocument {
  question: string;
  answer: string;
}

interface SearchResult {
  document: {
    id: string;
    [key: string]: unknown;
  };
}

// Initialize the search client
const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT || '',
  'index02',
  new AzureKeyCredential(process.env.AZURE_SEARCH_KEY || '')
);

// Function to sync documents from Neon DB to Azure Cognitive Search
export async function syncDocuments(clubId: string) {
  try {
    const sql = await getSql();
    
    // Get all documents for the club
    const documents = await sql`
      SELECT * FROM documents 
      WHERE club_id = ${clubId}
      ORDER BY created_at DESC
    ` as Document[];

    // Delete existing documents for this club
    const deleteResults = await searchClient.search('*', {
      filter: `club_id eq '${clubId}' and type eq 'document'`,
      select: ['id'],
      top: 1000
    });

    const existingDocs: SearchDocument[] = [];
    for await (const result of deleteResults.results) {
      const searchResult = result as SearchResult;
      existingDocs.push({ id: searchResult.document.id } as SearchDocument);
    }

    if (existingDocs.length > 0) {
      console.log(`Deleting ${existingDocs.length} existing documents...`);
      await searchClient.deleteDocuments(existingDocs);
    }

    // Upload new documents
    const searchDocuments: SearchDocument[] = documents.map((doc) => ({
      id: doc.id.toString(),
      title: doc.title,
      content: doc.content,
      club_id: clubId,
      type: 'document'
    }));

    console.log(`Uploading ${searchDocuments.length} documents...`);
    const uploadResult = await searchClient.uploadDocuments(searchDocuments);
    console.log('Upload completed:', uploadResult);

    return { success: true, message: `Synced ${documents.length} documents` };
  } catch (error) {
    console.error('Error syncing documents:', error);
    return { success: false, message: String(error) };
  }
}

// Function to sync QA examples from Neon DB to Azure Cognitive Search
export async function syncQAExamples(clubId: string) {
  try {
    const sql = await getSql();
    
    // Get all QA examples for the club
    const examples = await sql`
      SELECT * FROM qa_examples 
      WHERE club_id = ${clubId}
      ORDER BY created_at DESC
    ` as QAExample[];

    // Delete existing QA examples for this club
    const deleteResults = await searchClient.search('*', {
      filter: `club_id eq '${clubId}' and type eq 'qa_example'`,
      select: ['id'],
      top: 1000
    });

    const existingExamples: SearchDocument[] = [];
    for await (const result of deleteResults.results) {
      const searchResult = result as SearchResult;
      existingExamples.push({ id: searchResult.document.id } as SearchDocument);
    }

    if (existingExamples.length > 0) {
      console.log(`Deleting ${existingExamples.length} existing QA examples...`);
      await searchClient.deleteDocuments(existingExamples);
    }

    // Upload new QA examples only if we have any
    if (examples.length > 0) {
      const searchExamples: SearchQAExample[] = examples.map((example) => ({
        id: example.id.toString(),
        title: example.question, // Use question as title for searchability
        content: example.answer, // Use answer as content
        question: example.question,
        answer: example.answer,
        club_id: clubId,
        type: 'qa_example'
      }));

      console.log(`Uploading ${searchExamples.length} QA examples...`);
      const uploadResult = await searchClient.uploadDocuments(searchExamples);
      console.log('Upload completed:', uploadResult);
    } else {
      console.log('No QA examples to upload');
    }

    return { success: true, message: `Synced ${examples.length} QA examples` };
  } catch (error) {
    console.error('Error syncing QA examples:', error);
    return { success: false, message: String(error) };
  }
}

// Function to sync all data for a club
export async function syncAllData(clubId: string) {
  const docResult = await syncDocuments(clubId);
  const qaResult = await syncQAExamples(clubId);

  return {
    success: docResult.success && qaResult.success,
    documents: docResult,
    qaExamples: qaResult
  };
}