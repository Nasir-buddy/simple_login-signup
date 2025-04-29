-- Create a todos table in Supabase
CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own todos" ON todos;
DROP POLICY IF EXISTS "Users can read their own todos" ON todos;
DROP POLICY IF EXISTS "Users can update their own todos" ON todos;
DROP POLICY IF EXISTS "Users can delete their own todos" ON todos;

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

-- Create uploads table
CREATE TABLE IF NOT EXISTS uploads (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  type TEXT NOT NULL,
  size BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS) for uploads
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own uploads" ON uploads;
DROP POLICY IF EXISTS "Users can read their own uploads" ON uploads;
DROP POLICY IF EXISTS "Users can update their own uploads" ON uploads;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON uploads;

-- Create policy to allow users to create their own uploads
CREATE POLICY "Users can create their own uploads" ON uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to read their own uploads
CREATE POLICY "Users can read their own uploads" ON uploads FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to update their own uploads
CREATE POLICY "Users can update their own uploads" ON uploads FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own uploads
CREATE POLICY "Users can delete their own uploads" ON uploads FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for the uploads bucket
CREATE POLICY "Public access to uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'uploads' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'uploads' AND
  auth.uid() = owner
);

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'uploads' AND
  auth.uid() = owner
); 