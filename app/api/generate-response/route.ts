import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import OpenAI from 'openai';
import { AzureKeyCredential, SearchClient } from '@azure/search-documents';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// Initialize the search client
const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT || '',
  'index02',
  new AzureKeyCredential(process.env.AZURE_SEARCH_KEY || '')
);

export async function POST(req: Request) {
  try {
    const startTime = Date.now();
    let clubId;
    try {
      const auth = await verifyAuth(req);
      clubId = auth.clubId;
      console.log('Authentication successful, clubId:', clubId);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    const { message } = await req.json();
    console.log('Received message:', message);
    const sql = await getSql();

    // Get club configuration
    const configs = await sql`
      SELECT * FROM club_config WHERE club_id = ${clubId}
    `;
    console.log('Club configs found:', configs.length);

    if (configs.length === 0) {
      console.error('No club configuration found for clubId:', clubId);
      return NextResponse.json(
        { error: 'Club configuration not found' },
        { status: 404 }
      );
    }

    const config = configs[0];
    const clubContext = config.config?.club_context || '';
    const clubRules = config.config?.club_rules || '';
    console.log('Club context and rules loaded');

    // Search for relevant documents
    const documentResults = await searchClient.search(message, {
      filter: `club_id eq '${clubId}' and type eq 'document'`,
      select: ['title', 'content'],
      top: 3
    });

    const relevantDocuments = [];
    for await (const result of documentResults.results) {
      const doc = result.document as SearchDocument;
      relevantDocuments.push({
        title: doc.title,
        content: doc.content
      });
    }
    console.log('Relevant documents found:', relevantDocuments.length);

    // Search for relevant QA examples
    const qaResults = await searchClient.search(message, {
      filter: `club_id eq '${clubId}' and type eq 'qa_example'`,
      select: ['title', 'content', 'question', 'answer'],
      top: 3
    });

    const relevantQAExamples = [];
    for await (const result of qaResults.results) {
      const qa = result.document as SearchQAExample;
      relevantQAExamples.push({
        question: qa.question,
        answer: qa.answer
      });
    }
    console.log('Relevant QA examples found:', relevantQAExamples.length);

    // Construct a more structured prompt
    const prompt = `Du är en kansli assistent för ${config.config?.club_name || 'golfklubben'}. 
Använd följande information för att svara på frågan:

KLUBBENS KONTEXT:
${clubContext}

KLUBBENS REGLER:
${clubRules}

RELEVANTA DOKUMENT:
${relevantDocuments.map(doc => `
Titel: ${doc.title}
Innehåll: ${doc.content}
---`).join('\n')}

RELEVANTA EXEMPEL PÅ FRÅGOR OCH SVAR:
${relevantQAExamples.map(qa => `
Fråga: ${qa.question}
Svar: ${qa.answer}
---`).join('\n')}

FRÅGA: ${message}

Svara på frågan baserat på den tillgängliga informationen.
Om du inte hittar relevant information i dokumenten eller exemplen,
använd klubbens kontext och regler för att ge ett generellt svar. 
Var tydlig och konkret i ditt svar.`;

    console.log('Prompt constructed, length:', prompt.length);

    try {
      // Generate response using OpenAI
      console.log('Calling OpenAI API...');
      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        max_tokens: 1000
      });
      console.log('OpenAI API call successful');

      const response = completion.choices[0].message.content;
      const tokensUsed = completion.usage?.total_tokens || 0;
      const responseTime = Date.now() - startTime;
      
      console.log('Response generated, length:', response?.length);
      console.log('Tokens used:', tokensUsed);
      console.log('Response time:', responseTime, 'ms');

      // Determine question category based on content
      const determineCategory = (question: string): string => {
        const lowerQuestion = question.toLowerCase();
        
        if (lowerQuestion.includes('medlem') || lowerQuestion.includes('avgift') || lowerQuestion.includes('kostnad')) {
          return 'Medlemskap & Avgifter';
        }
        if (lowerQuestion.includes('boka') || lowerQuestion.includes('starttid') || lowerQuestion.includes('tee time')) {
          return 'Bokningar & Starttider';
        }
        if (lowerQuestion.includes('bana') || lowerQuestion.includes('course') || lowerQuestion.includes('green')) {
          return 'Banor & Anläggning';
        }
        if (lowerQuestion.includes('tävling') || lowerQuestion.includes('turnering') || lowerQuestion.includes('competition')) {
          return 'Tävlingar & Events';
        }
        if (lowerQuestion.includes('lektion') || lowerQuestion.includes('träning') || lowerQuestion.includes('pro')) {
          return 'Träning & Lektioner';
        }
        if (lowerQuestion.includes('restaurang') || lowerQuestion.includes('mat') || lowerQuestion.includes('café')) {
          return 'Restaurang & Service';
        }
        if (lowerQuestion.includes('shop') || lowerQuestion.includes('butik') || lowerQuestion.includes('utrustning')) {
          return 'Golfshop & Utrustning';
        }
        if (lowerQuestion.includes('junior') || lowerQuestion.includes('ungdom') || lowerQuestion.includes('barn')) {
          return 'Juniorverksamhet';
        }
        if (lowerQuestion.includes('öppet') || lowerQuestion.includes('tid') || lowerQuestion.includes('kontakt')) {
          return 'Öppettider & Kontakt';
        }
        
        return 'Övrigt';
      };

      const category = determineCategory(message);
      
      // Log interaction
      await sql`
        INSERT INTO user_interactions (
          club_id,
          interaction_type,
          question,
          answer,
          response_time_ms,
          tokens_used,
          category
        ) VALUES (
          ${clubId},
          'chat',
          ${message},
          ${response},
          ${responseTime},
          ${tokensUsed},
          ${category}
        )
      `;
      console.log('Interaction logged to database');

      return NextResponse.json({ response });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      return NextResponse.json(
        { error: 'Failed to generate response from OpenAI' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('General error in generate-response:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
