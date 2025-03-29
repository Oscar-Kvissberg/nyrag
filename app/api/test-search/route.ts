import { NextResponse } from 'next/server';
import { AzureKeyCredential, SearchClient } from '@azure/search-documents';

export async function GET() {
    try {
        // Initialize the search client
        const searchClient = new SearchClient(
            process.env.AZURE_SEARCH_ENDPOINT!,
            'golf-knowledge-base',
            new AzureKeyCredential(process.env.AZURE_SEARCH_KEY!)
        );

        // Try to perform a simple search
        const searchResults = await searchClient.search('*', { top: 1 });
        
        // Convert async iterator to array
        const results = [];
        for await (const result of searchResults.results) {
            results.push(result);
        }

        return NextResponse.json({
            success: true,
            message: 'Successfully connected to Azure Search',
            endpoint: process.env.AZURE_SEARCH_ENDPOINT,
            results: results
        });
    } catch (error) {
        console.error('Azure Search Test Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            endpoint: process.env.AZURE_SEARCH_ENDPOINT
        }, { status: 500 });
    }
} 