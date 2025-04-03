-- Create users table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(100) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        club_id NVARCHAR(100) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'user',
        created_at DATETIME2 DEFAULT GETDATE()
    );

    CREATE INDEX IX_users_username ON users(username);
    CREATE INDEX IX_users_club_id ON users(club_id);
END;

-- Create documents table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[documents]') AND type in (N'U'))
BEGIN
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
END;

-- Create qa_examples table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[qa_examples]') AND type in (N'U'))
BEGIN
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
END;

-- Create example_questions table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[example_questions]') AND type in (N'U'))
BEGIN
    CREATE TABLE example_questions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        club_id NVARCHAR(100) NOT NULL,
        label NVARCHAR(255) NOT NULL,
        text NVARCHAR(MAX) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE()
    );

    CREATE INDEX IX_example_questions_club_id ON example_questions(club_id);
END;

-- Create triggers
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TR_users_update]') AND type in (N'TR'))
BEGIN
    EXEC('CREATE TRIGGER TR_users_update
    ON users
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE users
        SET updated_at = GETDATE()
        FROM users u
        INNER JOIN inserted i ON u.id = i.id
    END')
END;

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TR_documents_update]') AND type in (N'TR'))
BEGIN
    EXEC('CREATE TRIGGER TR_documents_update
    ON documents
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE documents
        SET updated_at = GETDATE()
        FROM documents d
        INNER JOIN inserted i ON d.id = i.id
    END')
END;

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TR_qa_examples_update]') AND type in (N'TR'))
BEGIN
    EXEC('CREATE TRIGGER TR_qa_examples_update
    ON qa_examples
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE qa_examples
        SET updated_at = GETDATE()
        FROM qa_examples qa
        INNER JOIN inserted i ON qa.id = i.id
    END')
END;

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TR_example_questions_update]') AND type in (N'TR'))
BEGIN
    EXEC('CREATE TRIGGER TR_example_questions_update
    ON example_questions
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE example_questions
        SET updated_at = GETDATE()
        FROM example_questions e
        INNER JOIN inserted i ON e.id = i.id
    END')
END;

-- Insert default example questions for Vasatorp
IF NOT EXISTS (SELECT 1 FROM example_questions WHERE club_id = 'vasatorp')
BEGIN
    INSERT INTO example_questions (club_id, label, text)
    VALUES 
    ('vasatorp', 'Medlemskap & Förmåner', 'Hej,\n\nJag har en fråga kring era medlemskap...'),
    ('vasatorp', 'Banstatus & Greenfee', 'Hej,\n\nJag har ett par frågor angående era banor...'),
    ('vasatorp', 'Restaurang & Betalning', 'Hej,\n\nJag har en fråga kring Vasatorpskortet...'),
    ('vasatorp', 'Träning & Driving Range', 'Hej,\n\nJag undrar lite kring era träningsmöjligheter...');
END; 