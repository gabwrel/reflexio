-- Reaction Speed Trainer: Supabase Schema Setup SQL
-- Copy and run this script in your Supabase SQL Editor to provision the database tables.

-- Create scores table
CREATE TABLE IF NOT EXISTS public.scores (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  email TEXT,
  game_mode TEXT NOT NULL CHECK (game_mode IN ('classic', 'spike')),
  score NUMERIC NOT NULL,
  reaction_time_ms NUMERIC,
  remaining_time_ms NUMERIC,
  defuse_score NUMERIC,
  is_guest BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow anonymous or authenticated read access to all records (for global stats and leaderboards)
CREATE POLICY "Allow public read access" 
  ON public.scores 
  FOR SELECT 
  USING (true);

-- Allow anonymous or authenticated insert access (since submissions are done via the server proxy, 
-- or you can configure this to allow inserts directly if using custom Supabase security)
CREATE POLICY "Allow service insert access" 
  ON public.scores 
  FOR INSERT 
  WITH CHECK (true);

-- Allow anonymous or authenticated read access to users
CREATE POLICY "Allow public users read"
  ON public.users
  FOR SELECT
  USING (true);

-- Allow inserts/updates on users
CREATE POLICY "Allow service users write"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Indexes for performance tuning
-- Optimize leaderboard queries by game_mode and score sorting
CREATE INDEX IF NOT EXISTS idx_scores_game_mode_score ON public.scores(game_mode, score DESC);
-- Optimize profile queries by lowercase display name
CREATE INDEX IF NOT EXISTS idx_scores_display_name ON public.scores(LOWER(display_name));
-- Optimize recent scores sorting
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON public.scores(created_at DESC);
