import { NextResponse } from 'next/server';
import sql from 'mssql';

export async function GET() {
  try {
    // SQL configuration
    const sqlConfig = {
      user: process.env.AZURE_SQL_USER,
      password: process.env.AZURE_SQL_PASSWORD,
      server: process.env.AZURE_SQL_SERVER || '',
      database: process.env.AZURE_SQL_DATABASE,
      options: {
        encrypt: true,
        trustServerCertificate: false,
        requestTimeout: 30000,
        connectionTimeout: 30000,
      },
    };

    console.log('Attempting to connect to database with config:', {
      server: process.env.AZURE_SQL_SERVER,
      database: process.env.AZURE_SQL_DATABASE,
      user: process.env.AZURE_SQL_USER,
      hasPassword: !!process.env.AZURE_SQL_PASSWORD
    });

    const pool = await sql.connect(sqlConfig);
    
    // Try a simple query
    const result = await pool.request().query('SELECT @@VERSION as version');
    
    await pool.close();

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully connected to database',
      version: result.recordset[0].version
    });
  } catch (error) {
    console.error('Database connection error:', error);
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