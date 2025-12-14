-- ============================================
-- Todo App Database Schema
-- ============================================
-- This schema supports:
-- - Parent-child task relationships (subtasks)
-- - Time-based scheduling (start_time, end_time)
-- - Automatic task breakdown control
-- - Calendar visualization
-- ============================================

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  parent_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  scheduled_time TEXT, -- Legacy field for subtask time (HH:MM format)
  start_time TIMESTAMP WITH TIME ZONE, -- Task start date/time
  end_time TIMESTAMP WITH TIME ZONE, -- Task end date/time
  should_breakdown BOOLEAN DEFAULT TRUE, -- Whether to auto-breakdown into subtasks
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
-- In production, you should restrict this based on user authentication
CREATE POLICY "Allow all operations on todos" ON todos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at DESC);

-- Index on parent_id for faster queries of subtasks
CREATE INDEX IF NOT EXISTS idx_todos_parent_id ON todos(parent_id);

-- Index on start_time for calendar queries
CREATE INDEX IF NOT EXISTS idx_todos_start_time ON todos(start_time);

-- Index on end_time for calendar queries
CREATE INDEX IF NOT EXISTS idx_todos_end_time ON todos(end_time);

-- Composite index for date range queries (calendar view)
CREATE INDEX IF NOT EXISTS idx_todos_time_range ON todos(start_time, end_time) 
  WHERE start_time IS NOT NULL OR end_time IS NOT NULL;

-- Index for filtering parent todos (tasks without parent_id)
CREATE INDEX IF NOT EXISTS idx_todos_parent_tasks ON todos(parent_id) 
  WHERE parent_id IS NULL;

-- ============================================
-- Reminders Table
-- ============================================
-- Create reminders table for quick reminders (separate from todos)
CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS) for reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for reminders
CREATE POLICY "Allow all operations on reminders" ON reminders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes for reminders
CREATE INDEX IF NOT EXISTS idx_reminders_created_at ON reminders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(completed);

-- Create trigger to automatically update updated_at for reminders
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Automatic Timestamp Updates
-- ============================================

-- Create a function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Migration Script (for existing databases)
-- ============================================
-- Run this if you already have a todos table
-- It will add new columns without affecting existing data
-- ============================================

DO $$ 
BEGIN
  -- Add start_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'todos' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE todos ADD COLUMN start_time TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added start_time column';
  END IF;
  
  -- Add end_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'todos' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE todos ADD COLUMN end_time TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added end_time column';
  END IF;
  
  -- Add should_breakdown column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'todos' AND column_name = 'should_breakdown'
  ) THEN
    ALTER TABLE todos ADD COLUMN should_breakdown BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Added should_breakdown column';
  END IF;
  
  -- Create indexes if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_todos_end_time'
  ) THEN
    CREATE INDEX idx_todos_end_time ON todos(end_time);
    RAISE NOTICE 'Created idx_todos_end_time index';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_todos_time_range'
  ) THEN
    CREATE INDEX idx_todos_time_range ON todos(start_time, end_time) 
      WHERE start_time IS NOT NULL OR end_time IS NOT NULL;
    RAISE NOTICE 'Created idx_todos_time_range index';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_todos_parent_tasks'
  ) THEN
    CREATE INDEX idx_todos_parent_tasks ON todos(parent_id) 
      WHERE parent_id IS NULL;
    RAISE NOTICE 'Created idx_todos_parent_tasks index';
  END IF;
END $$;
