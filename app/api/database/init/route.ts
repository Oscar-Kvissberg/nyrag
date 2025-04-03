import { NextResponse } from 'next/server';
import sql from 'mssql';

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

export async function POST() {
    try {
        // Connect to database
        const pool = await sql.connect(sqlConfig);

        // Drop existing tables if they exist
        await pool.request().query(`
            IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;
            IF OBJECT_ID('documents', 'U') IS NOT NULL DROP TABLE documents;
            IF OBJECT_ID('qa_examples', 'U') IS NOT NULL DROP TABLE qa_examples;
            IF OBJECT_ID('example_questions', 'U') IS NOT NULL DROP TABLE example_questions;
        `);

        // Create users table
        await pool.request().query(`
            CREATE TABLE users (
                id INT IDENTITY(1,1) PRIMARY KEY,
                username NVARCHAR(100) NOT NULL UNIQUE,
                hashed_password NVARCHAR(255) NOT NULL,
                club_id NVARCHAR(100) NOT NULL,
                role NVARCHAR(50) NOT NULL DEFAULT 'user',
                created_at DATETIME2 DEFAULT GETDATE()
            );

            CREATE INDEX IX_users_username ON users(username);
            CREATE INDEX IX_users_club_id ON users(club_id);
        `);

        // Create documents table
        await pool.request().query(`
            CREATE TABLE documents (
                id INT IDENTITY(1,1) PRIMARY KEY,
                club_id NVARCHAR(50) NOT NULL,
                title NVARCHAR(255) NOT NULL,
                content NVARCHAR(MAX) NOT NULL,
                created_at DATETIME2 DEFAULT GETDATE(),
                search_id NVARCHAR(255)
            );

            CREATE INDEX IX_documents_club_id ON documents(club_id);
            CREATE INDEX IX_documents_search_id ON documents(search_id);
        `);

        // Create qa_examples table
        await pool.request().query(`
            CREATE TABLE qa_examples (
                id INT IDENTITY(1,1) PRIMARY KEY,
                club_id NVARCHAR(50) NOT NULL,
                question NVARCHAR(MAX) NOT NULL,
                answer NVARCHAR(MAX) NOT NULL,
                created_at DATETIME2 DEFAULT GETDATE(),
                search_id NVARCHAR(255)
            );

            CREATE INDEX IX_qa_examples_club_id ON qa_examples(club_id);
            CREATE INDEX IX_qa_examples_search_id ON qa_examples(search_id);
        `);

        // Create example_questions table
        await pool.request().query(`
            CREATE TABLE example_questions (
                id INT IDENTITY(1,1) PRIMARY KEY,
                club_id NVARCHAR(100) NOT NULL,
                label NVARCHAR(255) NOT NULL,
                text NVARCHAR(MAX) NOT NULL,
                created_at DATETIME2 DEFAULT GETDATE()
            );

            CREATE INDEX IX_example_questions_club_id ON example_questions(club_id);
        `);

        // Insert default example questions for Vasatorp
        await pool.request().query(`
            INSERT INTO example_questions (club_id, label, text)
            VALUES 
            ('vasatorp', 'Medlemskap & Förmåner', 'Hej,\n\nJag har en fråga kring era medlemskap...'),
            ('vasatorp', 'Banstatus & Greenfee', 'Hej,\n\nJag har ett par frågor angående era banor...'),
            ('vasatorp', 'Restaurang & Betalning', 'Hej,\n\nJag har en fråga kring Vasatorpskortet...'),
            ('vasatorp', 'Träning & Driving Range', 'Hej,\n\nJag undrar lite kring era träningsmöjligheter...');
        `);

        await pool.close();

        return NextResponse.json({ 
            success: true, 
            message: 'Database initialized successfully' 
        });
    } catch (error) {
        console.error('Database initialization error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
} 