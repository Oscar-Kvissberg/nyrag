import { neon, neonConfig } from '@neondatabase/serverless';
import { Pool } from 'pg';

// Configure neon to use fetch API
neonConfig.fetchConnectionCache = true;

if (!process.env.NEON_DATABASE_URL) {
  throw new Error('NEON_DATABASE_URL is not defined');
}

// Create a pool for transactions and complex queries
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
});

// Create a simple SQL executor for single queries
const sql = neon(process.env.NEON_DATABASE_URL);

// Function to ensure all required tables exist
export async function ensureTables() {
  try {
    console.log('Starting to create database tables...');
    
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        club_id VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE
      )
    `;
    console.log('Users table created');

    // Drop and recreate daily_statistics table
    await sql`DROP TABLE IF EXISTS daily_statistics`;
    await sql`
      CREATE TABLE daily_statistics (
        id SERIAL PRIMARY KEY,
        club_id VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        total_interactions INTEGER DEFAULT 0,
        total_tokens_used INTEGER DEFAULT 0,
        average_response_time_ms FLOAT DEFAULT 0,
        positive_feedback_count INTEGER DEFAULT 0,
        negative_feedback_count INTEGER DEFAULT 0,
        UNIQUE(club_id, date)
      )
    `;
    console.log('Daily statistics table created');

    // Create user_interactions table
    await sql`
      CREATE TABLE IF NOT EXISTS user_interactions (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        club_id VARCHAR(100),
        interaction_type VARCHAR(50),
        question TEXT,
        answer TEXT,
        feedback VARCHAR(50),
        feedback_text TEXT,
        response_time_ms INTEGER,
        tokens_used INTEGER,
        category VARCHAR(100)
      )
    `;
    console.log('User interactions table created');

    // Create club_config table
    await sql`
      CREATE TABLE IF NOT EXISTS club_config (
        club_id VARCHAR(100) PRIMARY KEY,
        config JSONB NOT NULL DEFAULT '{}'::jsonb
      )
    `;
    console.log('Club config table created');

    // Create documents table
    await sql`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        club_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        search_id VARCHAR(255)
      )
    `;
    console.log('Documents table created');

    // Create qa_examples table
    await sql`
      CREATE TABLE IF NOT EXISTS qa_examples (
        id SERIAL PRIMARY KEY,
        club_id VARCHAR(100) NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        search_id VARCHAR(255)
      )
    `;
    console.log('QA examples table created');

    // Create example_questions table
    await sql`
      CREATE TABLE IF NOT EXISTS example_questions (
        id SERIAL PRIMARY KEY,
        club_id VARCHAR(100) NOT NULL,
        label VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Example questions table created');

    // Create indexes - each in a separate statement
    await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_club_id ON users(club_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interactions_club_id ON user_interactions(club_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON user_interactions(timestamp)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_documents_club_id ON documents(club_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_qa_examples_club_id ON qa_examples(club_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_example_questions_club_id ON example_questions(club_id)`;
    console.log('All indexes created');

    console.log('Database tables and indexes created successfully');
    return true;
  } catch (error) {
    console.error('Error ensuring tables:', error);
    return false;
  }
}

// Initialize the database
let dbInitialized = false;

// Function to get the SQL executor with initialization
export async function getSql() {
  if (!dbInitialized) {
    console.log('Initializing database...');
    dbInitialized = await ensureTables();
    console.log('Database initialization complete:', dbInitialized);
  }
  return sql;
}

// Function to get the pool with initialization
export async function getPool() {
  if (!dbInitialized) {
    console.log('Initializing database...');
    dbInitialized = await ensureTables();
    console.log('Database initialization complete:', dbInitialized);
  }
  return pool;
}

// Export the SQL executor and pool for backward compatibility
// These will be initialized when first used
export { sql, pool }; 