import { NextResponse } from 'next/server';
import sql from 'mssql';
import bcrypt from 'bcryptjs';

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

// Create users table if it doesn't exist
async function ensureUsersTable() {
    const pool = await sql.connect(sqlConfig);
    await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
        BEGIN
            CREATE TABLE users (
                id INT IDENTITY(1,1) PRIMARY KEY,
                username NVARCHAR(100) NOT NULL UNIQUE,
                password NVARCHAR(255) NOT NULL,
                club_id NVARCHAR(100) NOT NULL,
                role NVARCHAR(50) NOT NULL DEFAULT 'user',
                created_at DATETIME2 DEFAULT GETDATE(),
                updated_at DATETIME2 DEFAULT GETDATE()
            );

            CREATE INDEX IX_users_username ON users(username);
            CREATE INDEX IX_users_club_id ON users(club_id);
        END
    `);
    await pool.close();
}

// Add a new user
export async function POST(req: Request) {
    try {
        await ensureUsersTable();
        const { username, password, clubId, role = 'user' } = await req.json();

        if (!username || !password || !clubId) {
            return NextResponse.json(
                { error: 'Username, password, and clubId are required' },
                { status: 400 }
            );
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const pool = await sql.connect(sqlConfig);
        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('hashedPassword', sql.NVarChar, hashedPassword)
            .input('clubId', sql.NVarChar, clubId)
            .input('role', sql.NVarChar, role)
            .query(`
                IF NOT EXISTS (SELECT 1 FROM users WHERE username = @username)
                BEGIN
                    INSERT INTO users (username, hashed_password, club_id, role)
                    VALUES (@username, @hashedPassword, @clubId, @role)
                END
            `);

        await pool.close();

        return NextResponse.json({ 
            success: true, 
            message: 'User created successfully' 
        });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
}

// Get user by username
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json(
                { error: 'Username is required' },
                { status: 400 }
            );
        }

        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT id, username, club_id, role, created_at
                FROM users
                WHERE username = @username
            `);

        await pool.close();

        if (result.recordset.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ 
            success: true, 
            user: result.recordset[0] 
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
} 