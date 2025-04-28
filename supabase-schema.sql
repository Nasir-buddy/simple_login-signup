-- Create a todos table in Supabase
CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to create todos
CREATE POLICY "Users can create their own todos" ON todos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create policy to allow users to read their own todos
CREATE POLICY "Users can read their own todos" ON todos FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create policy to allow users to update their own todos
CREATE POLICY "Users can update their own todos" ON todos FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Create policy to allow users to delete their own todos
CREATE POLICY "Users can delete their own todos" ON todos FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Add a user_id column to associate todos with users
ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(); 