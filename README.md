# Todo Application with Supabase

A simple Todo application built with React, TypeScript and Supabase for backend storage and authentication.

## Features

- Create, read, update, and delete todo items
- Mark todos as complete/incomplete
- User authentication (sign up, sign in, sign out)
- Data stored in Supabase database
- Simple, clean UI

## Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account

## Supabase Setup

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)
2. After creating the project, go to the SQL Editor in your Supabase dashboard
3. Run the following SQL to create the todos table:

```sql
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
```

4. Go to Project Settings > API to get your Supabase URL and anon key

## Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Installation and Running

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn
   ```
3. Start the development server:
   ```
   npm run dev
   ```
   or
   ```
   yarn dev
   ```
4. Access the application at [http://localhost:5173](http://localhost:5173)

## Usage

1. Sign up or sign in to access the Todo application
2. Add new todos by typing in the input box and clicking "Add"
3. Mark todos as complete by clicking on the todo text
4. Edit todos by clicking the edit button
5. Delete todos by clicking the delete button

## Project Structure

- `src/Component/todo.tsx` - Main Todo component with CRUD functionality
- `src/lib/supabase.ts` - Supabase client configuration
- `src/context/AuthContext.tsx` - Authentication context for user management
