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
    
    // Check if users table exists and create it if it doesn't
    const usersTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `;
    
    if (!usersTableExists[0].exists) {
      await sql`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          hashed_password VARCHAR(255) NOT NULL,
          club_id VARCHAR(100) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP WITH TIME ZONE,
          tokens_used INTEGER DEFAULT 0
        )
      `;
      console.log('Users table created');
    } else {
      console.log('Users table already exists');
    }

    // Check if daily_statistics table exists and create it if it doesn't
    const dailyStatsTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'daily_statistics'
      )
    `;
    
    if (!dailyStatsTableExists[0].exists) {
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
    } else {
      console.log('Daily statistics table already exists');
    }

    // Check if user_interactions table exists and create it if it doesn't
    const userInteractionsTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_interactions'
      )
    `;
    
    if (!userInteractionsTableExists[0].exists) {
      await sql`
        CREATE TABLE user_interactions (
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
    } else {
      console.log('User interactions table already exists');
    }

    // Check if club_config table exists and create it if it doesn't
    const clubConfigTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'club_config'
      )
    `;
    
    if (!clubConfigTableExists[0].exists) {
      await sql`
        CREATE TABLE club_config (
          club_id VARCHAR(100) PRIMARY KEY,
          config JSONB NOT NULL DEFAULT '{}'::jsonb
        )
      `;
      console.log('Club config table created');
    } else {
      console.log('Club config table already exists');
    }

    // Check if documents table exists and create it if it doesn't
    const documentsTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'documents'
      )
    `;
    
    if (!documentsTableExists[0].exists) {
      await sql`
        CREATE TABLE documents (
          id SERIAL PRIMARY KEY,
          club_id VARCHAR(100) NOT NULL,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          search_id VARCHAR(255)
        )
      `;
      console.log('Documents table created');
    } else {
      console.log('Documents table already exists');
    }

    // Check if qa_examples table exists and create it if it doesn't
    const qaExamplesTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'qa_examples'
      )
    `;
    
    if (!qaExamplesTableExists[0].exists) {
      await sql`
        CREATE TABLE qa_examples (
          id SERIAL PRIMARY KEY,
          club_id VARCHAR(100) NOT NULL,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          search_id VARCHAR(255)
        )
      `;
      console.log('QA examples table created');
    } else {
      console.log('QA examples table already exists');
    }

    // Check if example_questions table exists and create it if it doesn't
    const exampleQuestionsTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'example_questions'
      )
    `;
    
    if (!exampleQuestionsTableExists[0].exists) {
      await sql`
        CREATE TABLE example_questions (
          id SERIAL PRIMARY KEY,
          club_id VARCHAR(100) NOT NULL,
          label VARCHAR(255) NOT NULL,
          text TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log('Example questions table created');
    } else {
      console.log('Example questions table already exists');
    }

    // Create indexes
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
let initializationPromise: Promise<boolean> | null = null;

// Function to get the SQL executor with initialization
export async function getSql() {
  if (!dbInitialized) {
    if (!initializationPromise) {
      initializationPromise = ensureTables();
    }
    dbInitialized = await initializationPromise;
    console.log('Database initialization complete:', dbInitialized);
  }
  return sql;
}

// Function to get the pool with initialization
export async function getPool() {
  if (!dbInitialized) {
    if (!initializationPromise) {
      initializationPromise = ensureTables();
    }
    dbInitialized = await initializationPromise;
    console.log('Database initialization complete:', dbInitialized);
  }
  return pool;
}

// Export the SQL executor and pool for backward compatibility
// These will be initialized when first used
export { sql, pool }; 