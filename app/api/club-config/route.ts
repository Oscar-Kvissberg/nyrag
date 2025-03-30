import { NextResponse } from 'next/server';
import sql from 'mssql';

// Get configuration for a specific club
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

    // Validate environment variables
    const server = process.env.AZURE_SQL_SERVER;
    const database = process.env.AZURE_SQL_DATABASE;
    const user = process.env.AZURE_SQL_USER;
    const password = process.env.AZURE_SQL_PASSWORD;

    if (!server || !database || !user || !password) {
      throw new Error('Missing required database configuration');
    }

    const sqlConfig = {
      server,
      database,
      user,
      password,
      options: {
        encrypt: true,
        trustServerCertificate: false
      }
    };

    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('clubId', sql.NVarChar, clubId)
      .query(`
        SELECT * FROM club_config 
        WHERE club_id = @clubId
      `);

    return NextResponse.json(result.recordset[0] || {});
  } catch (error) {
    console.error('Error fetching club config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch club configuration' },
      { status: 500 }
    );
  }
}

// Update configuration for a specific club
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('clubId');
    const config = await req.json();

    if (!clubId) {
      return NextResponse.json(
        { error: 'clubId is required' },
        { status: 400 }
      );
    }

    // Validate environment variables
    const server = process.env.AZURE_SQL_SERVER;
    const database = process.env.AZURE_SQL_DATABASE;
    const user = process.env.AZURE_SQL_USER;
    const password = process.env.AZURE_SQL_PASSWORD;

    if (!server || !database || !user || !password) {
      throw new Error('Missing required database configuration');
    }

    const sqlConfig = {
      server,
      database,
      user,
      password,
      options: {
        encrypt: true,
        trustServerCertificate: false
      }
    };

    const pool = await sql.connect(sqlConfig);
    await pool.request()
      .input('clubId', sql.NVarChar, clubId)
      .input('config', sql.NVarChar, JSON.stringify(config))
      .query(`
        MERGE club_config AS target
        USING (VALUES (@clubId, @config)) AS source (club_id, config)
        ON target.club_id = source.club_id
        WHEN MATCHED THEN
          UPDATE SET config = source.config
        WHEN NOT MATCHED THEN
          INSERT (club_id, config)
          VALUES (source.club_id, source.config);
      `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating club config:', error);
    return NextResponse.json(
      { error: 'Failed to update club configuration' },
      { status: 500 }
    );
  }
} 