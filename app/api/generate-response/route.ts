import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { AzureKeyCredential, SearchClient } from '@azure/search-documents';

interface SearchDocument {
  chunk_id: string;
  title: string;
  content: string;
}

interface SearchResult {
  '@search.score': number;
  '@search.rerankerScore': number;
  content: string;
  title: string;
}

const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT || '',
  'index01',
  new AzureKeyCredential(process.env.AZURE_SEARCH_KEY || '')
);

export async function POST(req: Request) {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message) {
      return new Response('Message is required', { status: 400 });
    }

    // First, perform semantic search using Azure AI Search
    const searchResponse = await fetch(
      `${process.env.AZURE_SEARCH_ENDPOINT}/indexes/index01/docs/search?api-version=2023-11-01`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.AZURE_SEARCH_KEY!
        },
        body: JSON.stringify({
          search: message,
          queryType: 'semantic',
          semanticConfiguration: 'default',
          select: 'content,title',
          top: 5
        })
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.statusText}`);
    }

    const searchResults = await searchResponse.json();
    console.log('Search results:', searchResults);

    // Get relevant email examples
    const emailResponse = await searchClient.search('*', {
      filter: "title eq 'email'",
      select: ['content'],
      top: 3
    });

    const emailExamples = [];
    for await (const result of emailResponse.results) {
      const doc = result.document as SearchDocument;
      const [question, answer] = doc.content.split('\n\n');
      emailExamples.push({ question, answer });
    }

    // Create context from search results and email examples
    const context = [
      // Add general knowledge from search results
      ...(searchResults.value as SearchResult[]).map(result => `${result.title}\n${result.content}`),
      // Add email examples
      '\nRelevanta exempel på e-postsvarsformat:\n',
      ...emailExamples.map(example => 
        `Fråga: ${example.question}\nSvar: ${example.answer}`
      )
    ].join('\n\n');

    // Then use OpenAI to generate a response based on the search results
    const client = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_DEPLOYMENT_NAME}`,
      defaultQuery: { 'api-version': '2024-02-15-preview' },
      defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_KEY }
    });

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `Du är en hjälpsam assistent för Vasatorps Golfklubb. Använd följande information för att svara på användarens fråga. 
        Om frågan är i form av ett e-postmeddelande, använd de medföljande exempel på e-postsvarsformat för att strukturera ditt svar på ett liknande sätt.
        Om du inte hittar relevant information, säg det artigt.`
      },
      {
        role: 'user',
        content: `Kontext:\n${context}\n\nFråga: ${message}`
      }
    ];

    const completion = await client.chat.completions.create({
      model: process.env.AZURE_DEPLOYMENT_NAME!,
      messages: messages,
      max_tokens: 800,
      temperature: 0.7,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    console.log('Received response:', completion);

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('No response from Azure OpenAI');
    }

    const response = completion.choices[0].message?.content || '';
    return new Response(JSON.stringify({ response }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in generate-response:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : String(error)
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
