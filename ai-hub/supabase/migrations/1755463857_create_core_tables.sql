-- Migration: create_core_tables
-- Created at: 1755463857

-- Enable pgvector extension
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS ltree SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- Core Users table (from 1755464042_create_core_tables_correct.sql)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects Table (from 1755463857_create_core_tables.sql)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  github_url TEXT,
  status TEXT DEFAULT 'active',
  technologies JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge Items Table (from 1755463857_create_core_tables.sql)
CREATE TABLE IF NOT EXISTS knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  source_url TEXT,
  item_type TEXT,
  tags JSONB DEFAULT '[]',
  embedding extensions.vector(1536),
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Content Table (from 1755463857_create_core_tables.sql)
CREATE TABLE IF NOT EXISTS ai_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  url TEXT UNIQUE,
  source TEXT,
  content_type TEXT,
  authors JSONB DEFAULT '[]',
  published_at TIMESTAMP WITH TIME ZONE,
  relevance_score DECIMAL(3,2),
  embedding extensions.vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Data Table (from 1755463857_create_core_tables.sql)
CREATE TABLE IF NOT EXISTS stock_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  company_name TEXT,
  price DECIMAL(10,2),
  change_percent DECIMAL(5,2),
  volume BIGINT,
  market_cap BIGINT,
  sector TEXT DEFAULT 'technology',
  is_ai_related BOOLEAN DEFAULT TRUE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, timestamp)
);

-- Hackathons Table (from 1755463857_create_core_tables.sql)
CREATE TABLE IF NOT EXISTS hackathons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  platform TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  prize_amount INTEGER,
  location TEXT,
  is_virtual BOOLEAN DEFAULT FALSE,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Companies Table (from 1755463857_create_core_tables.sql)
CREATE TABLE IF NOT EXISTS ai_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  funding_stage TEXT,
  total_funding BIGINT,
  last_funding_date DATE,
  yc_batch TEXT,
  founders JSONB DEFAULT '[]',
  industry_tags JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Market Data Table (from 1755463857_create_core_tables.sql)
CREATE TABLE IF NOT EXISTS job_market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  experience_level TEXT,
  remote_friendly BOOLEAN,
  ai_related BOOLEAN DEFAULT TRUE,
  posted_date DATE,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Newsletters Table (from 1755463857_create_core_tables.sql)
CREATE TABLE IF NOT EXISTS newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT NOT NULL,
  content TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  is_personalized BOOLEAN DEFAULT TRUE
);

-- User Analytics Table (from 1755463857_create_core_tables.sql)
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompt Library Table (from 1755463857_create_core_tables.sql)
CREATE TABLE IF NOT EXISTS prompt_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  category TEXT,
  tags JSONB DEFAULT '[]',
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompt Templates Table (from 1755464013_create_core_tables_fixed.sql)
CREATE TABLE IF NOT EXISTS prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    template TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    category VARCHAR(100) DEFAULT 'general',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    rating_avg DECIMAL(4,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    semantic_embedding extensions.vector(384),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompt Chains Table (from 1755464013_create_core_tables_fixed.sql)
CREATE TABLE IF NOT EXISTS prompt_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    chain_config JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    execution_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_execution_time INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance (consolidated from all files)
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_user_id ON knowledge_items(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletters_user_id ON newsletters(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_source ON ai_content(source);
CREATE INDEX IF NOT EXISTS idx_ai_content_published_at ON ai_content(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_hackathons_start_date ON hackathons(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_data_symbol_timestamp ON stock_data(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_event ON user_analytics(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_timestamp ON user_analytics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_library_user_id ON prompt_library(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_library_category ON prompt_library(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_chains_user_id ON prompt_chains(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_chains_config ON prompt_chains USING GIN(chain_config);
CREATE INDEX IF NOT EXISTS idx_prompt_chains_success ON prompt_chains(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics(event_type);

-- Vector similarity search indexes (only for existing columns)
CREATE INDEX IF NOT EXISTS knowledge_items_embedding_idx ON knowledge_items USING ivfflat (embedding extensions.vector_cosine_ops);
CREATE INDEX IF NOT EXISTS ai_content_embedding_idx ON ai_content USING ivfflat (embedding extensions.vector_cosine_ops);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_chains ENABLE ROW LEVEL SECURITY;

-- RLS policies (consolidated and made idempotent)
DROP POLICY IF EXISTS "Users can only access their own projects" ON projects;
CREATE POLICY "Users can only access their own projects" ON projects
  FOR ALL USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only access their own knowledge items" ON knowledge_items;
CREATE POLICY "Users can only access their own knowledge items" ON knowledge_items
  FOR ALL USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only access their own newsletters" ON newsletters;
CREATE POLICY "Users can only access their own newsletters" ON newsletters
  FOR ALL USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can access their own prompts and public ones" ON prompt_library;
CREATE POLICY "Users can access their own prompts and public ones" ON prompt_library
  FOR SELECT USING ((select auth.uid()) = user_id OR is_public = TRUE);

DROP POLICY IF EXISTS "Users can only modify their own prompts" ON prompt_library;
CREATE POLICY "Users can only modify their own prompts" ON prompt_library
  FOR ALL USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only access their own analytics" ON user_analytics;
CREATE POLICY "Users can only access their own analytics" ON user_analytics
  FOR ALL USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own and public prompt templates" ON prompt_templates;
CREATE POLICY "Users can view their own and public prompt templates"
    ON prompt_templates
    FOR SELECT
    USING ((select auth.uid()) = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can insert their own prompt templates" ON prompt_templates;
CREATE POLICY "Users can insert their own prompt templates"
    ON prompt_templates
    FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own and public prompt chains" ON prompt_chains;
CREATE POLICY "Users can view their own and public prompt chains"
    ON prompt_chains
    FOR SELECT
    USING ((select auth.uid()) = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can insert their own prompt chains" ON prompt_chains;
CREATE POLICY "Users can insert their own prompt chains"
    ON prompt_chains
    FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Public access to AI content" ON ai_content;
CREATE POLICY "Public access to AI content" ON ai_content
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public hackathons access" ON hackathons;
CREATE POLICY "Public hackathons access" ON hackathons
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public stock data access" ON stock_data;
CREATE POLICY "Public stock data access" ON stock_data
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public AI companies access" ON ai_companies;
CREATE POLICY "Public AI companies access" ON ai_companies
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public job market data access" ON job_market_data;
CREATE POLICY "Public job market data access" ON job_market_data
  FOR SELECT USING (true);

-- Functions and Triggers (consolidated)
CREATE OR REPLACE FUNCTION update_prompt_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update usage count for template
    IF NEW.prompt_template_id IS NOT NULL THEN
        UPDATE prompt_templates
        SET usage_count = usage_count + 1,
            updated_at = NOW()
        WHERE id = NEW.prompt_template_id;
    END IF;

    -- Update execution count for chain
    IF NEW.prompt_chain_id IS NOT NULL THEN
        UPDATE prompt_chains
        SET execution_count = execution_count + 1,
            updated_at = NOW()
        WHERE id = NEW.prompt_chain_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for prompt_executions are defined in 20250820003214_create_prompt_management_system.sql

CREATE OR REPLACE FUNCTION validate_password(password text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
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
    has_special := password ~ '[!@#$%^&*()_+-=[]{};:''",.<>/?]';

    -- Require at least 3 of 4 character types
    RETURN
        (has_uppercase::int +
         has_lowercase::int +
         has_number::int +
         has_special::int) >= 3;
END;
$$;

CREATE OR REPLACE FUNCTION set_updated_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = now();
    NEW.updated_by = (SELECT auth.uid());
    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'trg_projects_updated_metadata'
    ) THEN
        CREATE TRIGGER trg_projects_updated_metadata
        BEFORE UPDATE ON projects
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_metadata();
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'trg_prompt_templates_updated_metadata'
    ) THEN
        CREATE TRIGGER trg_prompt_templates_updated_metadata
        BEFORE UPDATE ON prompt_templates
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_metadata();
    END IF;
END$$;

CREATE OR REPLACE FUNCTION get_prompt_subcategories(parent_path text)
RETURNS TABLE (
    id uuid,
    name text,
    full_path text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pt.id,
        pt.name,
        pt.category_path::text
    FROM prompt_templates pt
    WHERE pt.category_path <@ parent_path::extensions.ltree;
END;
$$;

CREATE OR REPLACE FUNCTION delete_old_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete records older than 90 days
  DELETE FROM user_analytics
  WHERE timestamp < NOW() - INTERVAL '90 days';

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER weekly_analytics_cleanup
AFTER INSERT ON user_analytics
EXECUTE FUNCTION delete_old_analytics();

SELECT 'Database Enhanced Successfully' AS status;