import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

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

    // Create context from search results
    const context = searchResults.value
      .map((result: any) => `${result.title}\n${result.content}`)
      .join('\n\n');

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
        content: `You are a helpful assistant for Vasatorps Golfklubb. Use the following information to answer the user's question. If you don't find relevant information, say so politely.`
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${message}`
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

  } catch (error: any) {
    console.error('Error in generate-response:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate response',
        details: error.message 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
