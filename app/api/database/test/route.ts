import { NextResponse } from 'next/server';
import sql from 'mssql';

export async function GET() {
  console.log('Starting database connection test...');
  
  try {
    // Validate environment variables
    const server = process.env.AZURE_SQL_SERVER;
    const database = process.env.AZURE_SQL_DATABASE;
    const user = process.env.AZURE_SQL_USER;
    const password = process.env.AZURE_SQL_PASSWORD;

    if (!server || !database || !user || !password) {
      console.error('Missing environment variables:', {
        hasServer: !!server,
        hasDatabase: !!database,
        hasUser: !!user,
        hasPassword: !!password
      });
      throw new Error('Missing required database configuration');
    }

    // SQL configuration for Vercel
    const sqlConfig = {
      user,
      password,
      server,
      database,
      options: {
        encrypt: true,
        trustServerCertificate: false,
        requestTimeout: 30000,
        connectionTimeout: 30000,
        // Vercel specific settings
        enableArithAbort: true,
        maxRetriesOnTransientErrors: 3,
        // Disable connection pooling for serverless
        pool: false
      },
    };

    console.log('Attempting to connect to database with config:', {
      server,
      database,
      user,
      hasPassword: !!password,
      options: sqlConfig.options
    });

    // Use a simpler connection approach
    const pool = await sql.connect(sqlConfig);
    console.log('Successfully connected to database');
    
    // Try a simple query
    console.log('Executing test query...');
    const result = await pool.request().query('SELECT @@VERSION as version');
    console.log('Query executed successfully');
    
    await pool.close();
    console.log('Database connection closed');

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully connected to database',
      version: result.recordset[0].version
    });
  } catch (error) {
    console.error('Database connection error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown error type'
    });

    // Check for specific error types
    if (error instanceof sql.ConnectionError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Connection error',
          details: error.message,
          code: error.code
        },
        { status: 503 }
      );
    }

    if (error instanceof sql.RequestError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Request error',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to database',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 