-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id INT IDENTITY(1,1) PRIMARY KEY,
    club_id NVARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    search_id NVARCHAR(255)
);

-- Create qa_examples table
CREATE TABLE IF NOT EXISTS qa_examples (
    id INT IDENTITY(1,1) PRIMARY KEY,
    club_id NVARCHAR(50) NOT NULL,
    question NVARCHAR(MAX) NOT NULL,
    answer NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    search_id NVARCHAR(255)
);

-- Create example_questions table
CREATE TABLE IF NOT EXISTS example_questions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    club_id NVARCHAR(50) NOT NULL,
    label NVARCHAR(255) NOT NULL,
    text NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Create triggers for updated_at
CREATE TRIGGER TR_documents_updated_at
ON documents
AFTER UPDATE
AS
BEGIN
    UPDATE documents
    SET updated_at = GETDATE()
    FROM documents d
    INNER JOIN inserted i ON d.id = i.id;
END;

CREATE TRIGGER TR_qa_examples_updated_at
ON qa_examples
AFTER UPDATE
AS
BEGIN
    UPDATE qa_examples
    SET updated_at = GETDATE()
    FROM qa_examples qa
    INNER JOIN inserted i ON qa.id = i.id;
END;

CREATE TRIGGER TR_example_questions_updated_at
ON example_questions
AFTER UPDATE
AS
BEGIN
    UPDATE example_questions
    SET updated_at = GETDATE()
    FROM example_questions eq
    INNER JOIN inserted i ON eq.id = i.id;
END;

-- Insert default example questions for Vasatorp
INSERT INTO example_questions (club_id, label, text)
VALUES 
('vasatorp', 'Medlemskap & Förmåner', 'Hej,

Jag har en fråga kring era medlemskap. Om jag skulle teckna ett Park-medlemskap och ibland vilja spela på TC-banan, är det möjligt att göra det och finns det någon rabatt för Park-medlemmar i sådana fall? Jag är även nyfiken på hur medlemslånen fungerar för TC och Classic-medlemskap. Är det några specifika villkor jag bör känna till?

Tack på förhand för hjälpen!

Vänliga hälsningar,
Mohamed Salah'),

('vasatorp', 'Banstatus & Greenfee', 'Hej,

Jag har ett par frågor angående era banor. Jag såg att Classic Course är under hålpipning och erbjuder reducerad greenfee under läktiden. Hur ofta uppdateras banstatusen på hemsidan, och vad händer om jag bokar en tid och det visar sig vara frost eller banan fortfarande läker?

Jag skulle även vilja veta hur reducerad greenfee fungerar rent praktiskt om man redan har ett medlemskap.

Tack för informationen!

Med vänlig hälsning,
Trent Alexander-Arnold'),

('vasatorp', 'Restaurang & Betalning', 'Hej,

Jag har en fråga kring Vasatorpskortet och era kiosker. Om man glömmer sitt Vasatorpskort hemma, går det att koppla det till en app eller någon annan lösning för att ändå kunna få rabatt när man handlar i kiosken eller restaurangen?

Dessutom undrar jag om det är möjligt att boka bord i restaurangen i förväg, eller om det är först till kvarn som gäller? Vart bokar man detta isåfall?

Tack på förhand!

Vänliga hälsningar,
Andy Robertson'),

('vasatorp', 'Träning & Driving Range', 'Hej,

Jag undrar lite kring era träningsmöjligheter. Hur ofta har jag som vanlig medlem möjlighet att använda Trackman Range, och finns det några begränsningar för när man kan träna där?

Jag har även sett att det erbjuds rabatter på Driving Range under sportlovsveckan. Om jag har ett saldo på GolfMore-appen, gäller rabatten automatiskt när jag köper bollar, eller behöver jag göra något särskilt för att aktivera den?

Tack för hjälpen!

Med vänlig hälsning,
Virgil van Dijk');

-- Create indexes for better performance
CREATE INDEX IX_documents_club_id ON documents(club_id);
CREATE INDEX IX_qa_examples_club_id ON qa_examples(club_id);
CREATE INDEX IX_documents_search_id ON documents(search_id);
CREATE INDEX IX_qa_examples_search_id ON qa_examples(search_id); 