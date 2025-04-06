-- Create club_prompts table
CREATE TABLE IF NOT EXISTS club_prompts (
  id SERIAL PRIMARY KEY,
  club_id VARCHAR(100) NOT NULL UNIQUE,
  prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_club_prompts_club_id ON club_prompts(club_id); 