-- Enable UUIDs for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =======================
-- Tables
-- =======================
CREATE TABLE IF NOT EXISTS ai_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  summary text,
  url text,
  source text NOT NULL,
  content_type text CHECK (content_type IN ('news','paper','blog','tutorial')) DEFAULT 'news',
  authors text[] DEFAULT ARRAY[]::text[],
  published_at timestamptz,
  relevance_score int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  company_name text,
  price decimal(10,2) NOT NULL,
  change_percent decimal(5,2) DEFAULT 0,
  volume bigint,
  market_cap bigint,
  sector text DEFAULT 'Technology',
  is_ai_related boolean DEFAULT true,
  timestamp timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  github_url text,
  status text CHECK (status IN ('active','completed','paused')) DEFAULT 'active',
  technologies text[] DEFAULT ARRAY[]::text[],
  metrics jsonb DEFAULT '{}'::jsonb,
  is_favorite boolean DEFAULT false,
  progress int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text CHECK (type IN ('daily','weekly')) DEFAULT 'weekly',
  title text NOT NULL,
  content text NOT NULL,
  generated_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  is_personalized boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  template text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  category text DEFAULT 'general',
  tags text[] DEFAULT ARRAY[]::text[],
  is_public boolean DEFAULT true,
  usage_count int DEFAULT 0,
  rating_avg decimal(4,2) DEFAULT 0.00,
  rating_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prompt_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_template_id uuid REFERENCES prompt_templates(id) ON DELETE SET NULL,
  input_variables jsonb DEFAULT '{}'::jsonb,
  final_prompt text NOT NULL,
  ai_model text DEFAULT 'gpt-4',
  response_data jsonb DEFAULT '{}'::jsonb,
  execution_time int DEFAULT 0,
  token_usage jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'completed',
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS prompt_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_template_id uuid REFERENCES prompt_templates(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, prompt_template_id)
);

-- Todos table (for frontend connectivity test)
CREATE TABLE IF NOT EXISTS public.todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_complete boolean DEFAULT false,
  inserted_at timestamptz DEFAULT now()
);

-- =======================
-- RLS
-- =======================
ALTER TABLE ai_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Public read-only on content tables
CREATE POLICY "Public can view ai_content" ON ai_content FOR SELECT USING (true);
CREATE POLICY "Public can view stock_data" ON stock_data FOR SELECT USING (true);

-- Owner policies
-- Optimized RLS Policies

-- Projects Policy
DROP POLICY IF EXISTS "Users own projects" ON projects;
CREATE POLICY "Users own projects"
ON projects
FOR ALL
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Newsletters Policy
DROP POLICY IF EXISTS "Users own newsletters" ON newsletters;
CREATE POLICY "Users own newsletters"
ON newsletters
FOR ALL
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Prompt Templates Policies
DROP POLICY IF EXISTS "Public can view public prompts" ON prompt_templates;
CREATE POLICY "Public can view public prompts"
ON prompt_templates
FOR SELECT
USING (is_public = true OR (SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create prompts" ON prompt_templates;
CREATE POLICY "Users can create prompts"
ON prompt_templates
FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Owners can modify prompts" ON prompt_templates;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='prompt_templates' AND policyname='Owners can update prompts'
  ) THEN
    CREATE POLICY "Owners can update prompts"
    ON prompt_templates
    FOR UPDATE
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='prompt_templates' AND policyname='Owners can delete prompts'
  ) THEN
    CREATE POLICY "Owners can delete prompts"
    ON prompt_templates
    FOR DELETE
    USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

-- Prompt Executions Policy
DROP POLICY IF EXISTS "Users own executions" ON prompt_executions;
CREATE POLICY "Users own executions"
ON prompt_executions
FOR ALL
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Prompt Favorites Policy
DROP POLICY IF EXISTS "Users own favorites" ON prompt_favorites;
CREATE POLICY "Users own favorites"
ON prompt_favorites
FOR ALL
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Todos Policy
DROP POLICY IF EXISTS "Users own todos" ON public.todos;
CREATE POLICY "Users own todos"
ON public.todos
FOR ALL
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Stock Data Policy (Public Read + Potential Future Restrictions)
DROP POLICY IF EXISTS "Public can view stock data" ON stock_data;
CREATE POLICY "Public can view stock data"
ON stock_data
FOR SELECT
USING (true);

-- AI Content Policy (Public Read + Potential Future Restrictions)
DROP POLICY IF EXISTS "Public can view AI content" ON ai_content;
CREATE POLICY "Public can view AI content"
ON ai_content
FOR SELECT
USING (true);

SELECT 'RLS Policies Optimized' AS status;

-- Optional: allow public read (remove if you don’t want it)
-- CREATE POLICY "Public can view todos"
--   ON public.todos FOR SELECT USING (true);

-- =======================
-- Triggers: auto-update updated_at
-- =======================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_projects_updated_at') THEN
    CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prompt_templates_updated_at') THEN
    CREATE TRIGGER trg_prompt_templates_updated_at
    BEFORE UPDATE ON prompt_templates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- =======================
-- Enhanced Metadata Tracking
-- =======================
-- Enhanced Tracking Function
CREATE OR REPLACE FUNCTION set_updated_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = (SELECT auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_by to relevant tables
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

ALTER TABLE prompt_templates
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- Create/Replace Triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_projects_updated_metadata') THEN
    CREATE TRIGGER trg_projects_updated_metadata
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION set_updated_metadata();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prompt_templates_updated_metadata') THEN
    CREATE TRIGGER trg_prompt_templates_updated_metadata
    BEFORE UPDATE ON prompt_templates
    FOR EACH ROW EXECUTE FUNCTION set_updated_metadata();
  END IF;
END$$;

SELECT 'Updated Metadata Tracking Added' AS status;


-- =======================
-- Indexes
-- =======================
CREATE INDEX IF NOT EXISTS idx_ai_content_created_at ON ai_content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_content_type_pub ON ai_content(content_type, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_data_symbol ON stock_data(symbol);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_public ON prompt_templates(is_public, user_id);
CREATE INDEX IF NOT EXISTS idx_exec_user_template ON prompt_executions(user_id, prompt_template_id);
CREATE INDEX IF NOT EXISTS idx_fav_user_template ON prompt_favorites(user_id, prompt_template_id);
-- Drop Unused Indexes
DROP INDEX IF EXISTS idx_ai_content_source;
DROP INDEX IF EXISTS idx_ai_content_published_at;
DROP INDEX IF EXISTS idx_stock_data_symbol_timestamp;

-- Recommended Indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_updated
ON projects(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_public
ON prompt_templates(is_public, user_id);

CREATE INDEX IF NOT EXISTS idx_prompt_executions_user_template
ON prompt_executions(user_id, prompt_template_id, created_at DESC);

-- Vector Index Example (if you plan to use embeddings)
-- Requires vector extension
-- CREATE EXTENSION IF NOT EXISTS vector;
-- CREATE INDEX IF NOT EXISTS idx_ai_content_embedding
-- ON ai_content USING ivfflat (embedding vector_cosine_ops);

SELECT 'Indexes Optimized' AS status;

-- =======================
-- Seed data (FK-safe)
-- =======================
INSERT INTO ai_content (title, content, source, content_type) VALUES
('Latest AI Developments','Recent advances in AI technology...','AI News','news'),
('Machine Learning Tutorial','Learn ML fundamentals...','ML Blog','tutorial'),
('Research Paper: GPT-5','Abstract of latest research...','arXiv','paper')
ON CONFLICT DO NOTHING;

INSERT INTO stock_data (symbol, company_name, price, change_percent, sector) VALUES
('NVDA','NVIDIA Corp',875.50,2.3,'AI Hardware'),
('GOOGL','Alphabet (Google)',142.80,-0.5,'AI Software'),
('MSFT','Microsoft',378.90,1.2,'AI Cloud')
ON CONFLICT DO NOTHING;

INSERT INTO prompt_templates (user_id, name, description, template, category, tags)
VALUES
(NULL,'Code Review','Review code for best practices','Review this code: {{code}}','development', ARRAY['coding','review']),
(NULL,'Research Summary','Summarize research papers','Summarize: {{paper}}','research', ARRAY['research','summary']),
(NULL,'Meeting Notes','Convert meeting transcripts','Create notes from: {{transcript}}','productivity', ARRAY['meetings','notes'])
ON CONFLICT DO NOTHING;

SELECT 'ALL ESSENTIAL TABLES + TRIGGERS + INDEXES CREATED' AS status;

-- Password Strength Validation Function
CREATE OR REPLACE FUNCTION validate_password(password text)
RETURNS boolean AS $$
DECLARE
    has_uppercase boolean := false;
    has_lowercase boolean := false;
    has_number boolean := false;
    has_special boolean := false;
BEGIN
    -- Check length
    IF length(password) < 12 THEN
        RETURN false;
    END IF;

    -- Check for character types
    has_uppercase := password ~ '[A-Z]';
    has_lowercase := password ~ '[a-z]';
    has_number := password ~ '[0-9]';
    has_special := password ~ '[!@#$%^&*()_+\-=\[\]{};:''",.<>/?]';

    -- Require at least 3 of 4 character types
    RETURN
        (has_uppercase::int +
         has_lowercase::int +
         has_number::int +
         has_special::int) >= 3;
END;
$$ LANGUAGE plpgsql;

-- Example usage in auth trigger
CREATE OR REPLACE FUNCTION public.enforce_password_strength()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_password(NEW.password) THEN
        RAISE EXCEPTION 'Password does not meet complexity requirements';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger would typically be implemented in the auth system
-- This is a demonstration of the concept

SELECT 'Password Strength Validation Added' AS status;

/**
🚀 Recommended Enhancements:

Add vector embedding support for AI content
Implement more granular RLS policies
Create materialized views for analytics
Add full-text search capabilities
Would you like me to elaborate on any specific aspect of the schema or propose specific enhancements?

Since you're working with AI and prompt-related data, I recommend exploring these potential extensions:

pgvector for embedding storage
pg_trgm for fuzzy text matching
ltree for hierarchical prompt categorization
**/