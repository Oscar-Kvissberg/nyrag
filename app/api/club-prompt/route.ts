import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  console.log('GET /api/club-prompt - Starting request');
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get('clubId');
  console.log(`GET /api/club-prompt - clubId: ${clubId}`);

  if (!clubId) {
    console.log('GET /api/club-prompt - Missing clubId parameter');
    return NextResponse.json({ error: 'Missing clubId parameter' }, { status: 400 });
  }

  try {
    // Verify authentication
    console.log('GET /api/club-prompt - Verifying authentication');
    try {
      await verifyAuth(request);
      console.log('GET /api/club-prompt - Authentication verified');
    } catch (authError) {
      console.error('GET /api/club-prompt - Authentication error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    console.log('GET /api/club-prompt - Getting SQL connection');
    let sql;
    try {
      sql = await getSql();
      console.log('GET /api/club-prompt - SQL connection established');
    } catch (sqlError) {
      console.error('GET /api/club-prompt - SQL connection error:', sqlError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    console.log('GET /api/club-prompt - Executing SQL query');
    let result;
    try {
      result = await sql`
        SELECT prompt FROM club_prompts WHERE club_id = ${clubId}
      `;
      console.log(`GET /api/club-prompt - SQL query result: ${JSON.stringify(result)}`);
    } catch (queryError) {
      console.error('GET /api/club-prompt - SQL query error:', queryError);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    if (result.length === 0) {
      console.log('GET /api/club-prompt - No prompt found, returning default prompt');
      // Return the original prompt as default
      const defaultPrompt = `Du är en kansli assistent för {clubName}. 
Använd följande information för att svara på frågan:

KLUBBENS KONTEXT:
{clubContext}

KLUBBENS REGLER:
{clubRules}

RELEVANTA DOKUMENT:
{relevantDocuments}

RELEVANTA EXEMPEL PÅ FRÅGOR OCH SVAR:
{qaExamples}

FRÅGA: {message}

Svara på frågan baserat på den tillgängliga informationen.
Om du inte hittar relevant information i dokumenten eller exemplen,
använd klubbens kontext och regler för att ge ett generellt svar. 
Var tydlig och konkret i ditt svar.`;

      return NextResponse.json({ prompt: defaultPrompt });
    }

    console.log('GET /api/club-prompt - Returning existing prompt');
    return NextResponse.json({ prompt: result[0].prompt });
  } catch (error) {
    console.error('Error fetching club prompt:', error);
    return NextResponse.json({ error: 'Failed to fetch club prompt' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('POST /api/club-prompt - Starting request');
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get('clubId');
  console.log(`POST /api/club-prompt - clubId: ${clubId}`);

  if (!clubId) {
    console.log('POST /api/club-prompt - Missing clubId parameter');
    return NextResponse.json({ error: 'Missing clubId parameter' }, { status: 400 });
  }

  try {
    // Verify authentication
    console.log('POST /api/club-prompt - Verifying authentication');
    try {
      await verifyAuth(request);
      console.log('POST /api/club-prompt - Authentication verified');
    } catch (authError) {
      console.error('POST /api/club-prompt - Authentication error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    const { prompt } = await request.json();
    console.log(`POST /api/club-prompt - Received prompt: ${prompt.substring(0, 50)}...`);

    if (!prompt) {
      console.log('POST /api/club-prompt - Missing prompt in request body');
      return NextResponse.json({ error: 'Missing prompt in request body' }, { status: 400 });
    }

    console.log('POST /api/club-prompt - Getting SQL connection');
    let sql;
    try {
      sql = await getSql();
      console.log('POST /api/club-prompt - SQL connection established');
    } catch (sqlError) {
      console.error('POST /api/club-prompt - SQL connection error:', sqlError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    console.log('POST /api/club-prompt - Executing SQL query');
    let result;
    try {
      result = await sql`
        INSERT INTO club_prompts (club_id, prompt, created_at, updated_at)
        VALUES (${clubId}, ${prompt}, NOW(), NOW())
        ON CONFLICT (club_id) 
        DO UPDATE SET prompt = ${prompt}, updated_at = NOW()
        RETURNING prompt
      `;
      console.log(`POST /api/club-prompt - SQL query result: ${JSON.stringify(result)}`);
    } catch (queryError) {
      console.error('POST /api/club-prompt - SQL query error:', queryError);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    console.log('POST /api/club-prompt - Returning saved prompt');
    return NextResponse.json({ prompt: result[0].prompt });
  } catch (error) {
    console.error('Error saving club prompt:', error);
    return NextResponse.json({ error: 'Failed to save club prompt' }, { status: 500 });
  }
} 