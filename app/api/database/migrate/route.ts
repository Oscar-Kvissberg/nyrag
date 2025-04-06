import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const sql = await getSql();
    
    // Get all migration files
    const migrationsDir = path.join(process.cwd(), 'app', 'db', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure migrations run in order
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Run each migration
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      
      // Split SQL content into individual statements
      const statements = sqlContent
        .split(';')
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0);
      
      // Execute each statement
      for (const statement of statements) {
        await sql.unsafe(statement);
      }
      
      console.log(`Completed migration: ${file}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully ran ${migrationFiles.length} migrations` 
    });
  } catch (error) {
    console.error('Error running migrations:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 