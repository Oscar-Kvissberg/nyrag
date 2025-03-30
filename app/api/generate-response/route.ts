import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { AzureKeyCredential, SearchClient } from '@azure/search-documents';
import sql from 'mssql';

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

// SQL configuration
const sqlConfig = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  server: process.env.AZURE_SQL_SERVER || '',
  database: process.env.AZURE_SQL_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

// Question categories with their keywords
const QUESTION_CATEGORIES = {
  'Bokning & Tider': [
    'boka', 'bokning', 'tid', 'tider', 'starttid', 'speltid', 'avboka',
    'när kan', 'ledig', 'tillgänglig', 'öppet', 'öppettider'
  ],
  'Priser & Avgifter': [
    'pris', 'priser', 'kosta', 'kostar', 'avgift', 'greenfee', 'medlemskap',
    'rabatt', 'erbjudande', 'betala', 'swish', 'kort'
  ],
  'Banor & Faciliteter': [
    'bana', 'banor', 'range', 'driving', 'träningsområde', 'studio',
    'shop', 'restaurang', 'omklädning', 'parkering', 'klubbhus'
  ],
  'Medlemskap & Förmåner': [
    'medlem', 'medlemskap', 'förmån', 'rabatt', 'ansöka', 'ansökan',
    'villkor', 'regler', 'rättighet'
  ],
  'Lektioner & Träning': [
    'lektion', 'träning', 'pro', 'instruktör', 'kurs', 'nybörjare',
    'gruppträning', 'privatlektion', 'golfskola'
  ],
  'Tävlingar & Events': [
    'tävling', 'turnering', 'event', 'anmälan', 'resultat',
    'tävlingskalender', 'klubbtävling'
  ],
  'Övrigt': [] // Default category for uncategorized questions
};

function categorizeQuestion(question: string): string {
  const lowercaseQuestion = question.toLowerCase();
  
  // Try to find a matching category based on keywords
  for (const [category, keywords] of Object.entries(QUESTION_CATEGORIES)) {
    if (keywords.some(keyword => lowercaseQuestion.includes(keyword))) {
      return category;
    }
  }
  
  return 'Övrigt';
}

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await req.json();
    const { message, clubId } = body;

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
          top: 3
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
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Categorize the question
    const category = categorizeQuestion(message);

    // Save statistics to database
    try {
      const pool = await sql.connect(sqlConfig);
      
      // Save interaction with category
      await pool.request()
        .input('clubId', sql.NVarChar, clubId || 'default')
        .input('interactionType', sql.NVarChar, 'chat')
        .input('question', sql.NVarChar, message)
        .input('answer', sql.NVarChar, response)
        .input('responseTimeMs', sql.Int, responseTime)
        .input('tokensUsed', sql.Int, completion.usage?.total_tokens || 0)
        .input('category', sql.NVarChar, category)
        .query(`
          INSERT INTO user_interactions 
          (club_id, interaction_type, question, answer, response_time_ms, tokens_used, category)
          VALUES 
          (@clubId, @interactionType, @question, @answer, @responseTimeMs, @tokensUsed, @category)
        `);

      // Update daily statistics including category counts
      const today = new Date().toISOString().split('T')[0];
      await pool.request()
        .input('date', sql.Date, today)
        .input('responseTimeMs', sql.Int, responseTime)
        .input('tokensUsed', sql.Int, completion.usage?.total_tokens || 0)
        .input('category', sql.NVarChar, category)
        .query(`
          MERGE daily_statistics AS target
          USING (VALUES (@date)) AS source(date)
          ON target.date = source.date
          WHEN MATCHED THEN
            UPDATE SET
              total_interactions = total_interactions + 1,
              total_tokens_used = total_tokens_used + @tokensUsed,
              average_response_time_ms = ((average_response_time_ms * total_interactions) + @responseTimeMs) / (total_interactions + 1)
          WHEN NOT MATCHED THEN
            INSERT (date, total_interactions, total_tokens_used, average_response_time_ms)
            VALUES (@date, 1, @tokensUsed, @responseTimeMs);

          -- Update category statistics
          MERGE INTO question_categories AS target
          USING (VALUES (@date, @category, 1)) AS source(date, category, count)
          ON target.date = source.date AND target.category = source.category
          WHEN MATCHED THEN
            UPDATE SET count = target.count + 1
          WHEN NOT MATCHED THEN
            INSERT (date, category, count)
            VALUES (source.date, source.category, source.count);
        `);

      await pool.close();
    } catch (dbError) {
      console.error('Error saving statistics:', dbError);
      // Continue even if statistics saving fails
    }

    return new Response(JSON.stringify({ response, category }), {
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
