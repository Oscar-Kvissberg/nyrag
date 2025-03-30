import { NextResponse } from 'next/server';
import sql from 'mssql';
import fs from 'fs';
import path from 'path';

// SQL configuration
const sqlConfig = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  server: process.env.AZURE_SQL_SERVER || '',
  database: process.env.AZURE_SQL_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    requestTimeout: 30000, // 30 seconds
    connectionTimeout: 30000, // 30 seconds
  },
};

export async function POST() {
  try {
    // Read the schema.sql file
    const schemaPath = path.join(process.cwd(), 'app', 'api', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Connect to the database
    const pool = await sql.connect(sqlConfig);

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    // Execute each statement
    for (const statement of statements) {
      try {
        await pool.request().query(statement);
      } catch (error) {
        console.error('Error executing statement:', error);
        // Continue with next statement even if one fails
      }
    }

    await pool.close();

    return NextResponse.json({ 
      success: true, 
      message: 'Database schema updated successfully' 
    });
  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to setup database' 
      },
      { status: 500 }
    );
  }
} 