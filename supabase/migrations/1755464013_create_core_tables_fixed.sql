-- Migration: create_core_tables_fixed
-- Created at: 1755464013

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Core Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- Knowledge Base table with vector embeddings
CREATE TABLE knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  source_url TEXT,
  item_type TEXT, -- 'paper', 'article', 'prompt', 'template', 'note'
  tags JSONB DEFAULT '[]',
  embedding VECTOR(1536), -- OpenAI embeddings
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI News & Research content
CREATE TABLE ai_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  url TEXT UNIQUE,
  source TEXT, -- 'arxiv', 'papers_with_code', 'towards_data_science'
  content_type TEXT, -- 'news', 'paper', 'blog', 'tutorial'
  authors JSONB DEFAULT '[]',
  published_at TIMESTAMP WITH TIME ZONE,
  relevance_score DECIMAL(3,2),
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Data table
CREATE TABLE stock_data (
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

-- Hackathons table
CREATE TABLE hackathons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  platform TEXT, -- 'devpost', 'hackerearth', 'mlh'
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  prize_amount INTEGER,
  location TEXT,
  is_virtual BOOLEAN DEFAULT FALSE,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Companies & Startups
CREATE TABLE ai_companies (
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

-- Job Market Data
CREATE TABLE job_market_data (
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
  source TEXT, -- 'linkedin', 'indeed', 'glassdoor'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Newsletters & Reports
CREATE TABLE newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT, -- 'daily', 'weekly'
  title TEXT NOT NULL,
  content TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  is_personalized BOOLEAN DEFAULT TRUE
);

-- User Analytics
CREATE TABLE user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT, -- 'page_view', 'search', 'bookmark', 'download'
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompt Library
CREATE TABLE prompt_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- Create indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_knowledge_items_user_id ON knowledge_items(user_id);
CREATE INDEX idx_newsletters_user_id ON newsletters(user_id);
CREATE INDEX idx_ai_content_source ON ai_content(source);
CREATE INDEX idx_ai_content_published_at ON ai_content(published_at DESC);
CREATE INDEX idx_hackathons_start_date ON hackathons(start_date DESC);
CREATE INDEX idx_stock_data_symbol_timestamp ON stock_data(symbol, timestamp DESC);
CREATE INDEX idx_user_analytics_user_event ON user_analytics(user_id, event_type);
CREATE INDEX idx_user_analytics_timestamp ON user_analytics(timestamp DESC);

-- Enable vector similarity search
CREATE INDEX ON knowledge_items USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON ai_content USING ivfflat (embedding vector_cosine_ops);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects
CREATE POLICY "Users can only access their own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for knowledge items
CREATE POLICY "Users can only access their own knowledge items" ON knowledge_items
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for newsletters
CREATE POLICY "Users can only access their own newsletters" ON newsletters
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for prompt library
CREATE POLICY "Users can access their own prompts and public ones" ON prompt_library
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can only modify their own prompts" ON prompt_library
  FOR INSERT USING (auth.uid() = user_id);

CREATE POLICY "Users can only update their own prompts" ON prompt_library
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own prompts" ON prompt_library
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user analytics
CREATE POLICY "Users can only access their own analytics" ON user_analytics
  FOR ALL USING (auth.uid() = user_id);;