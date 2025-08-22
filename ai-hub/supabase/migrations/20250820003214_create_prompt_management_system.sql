-- ==================================================
-- SUPABASE DATABASE MIGRATION - PROMPT MANAGEMENT SYSTEM
-- ==================================================
-- Copy this entire file and paste it into Supabase Dashboard > SQL Editor
-- Then click "Run" to apply all changes at once
--
-- This migration creates:
-- ✅ 5 new tables for prompt management system
-- ✅ Row Level Security (RLS) policies
-- ✅ Performance indexes
-- ✅ Database functions and triggers
-- ✅ Sample data
-- ==================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==================================================
-- TABLE CREATION
-- ==================================================

-- Create prompt templates table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompt chains table for multi-step reasoning
CREATE TABLE IF NOT EXISTS prompt_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    chain_config JSONB NOT NULL, -- Array of prompt steps with conditions
    is_public BOOLEAN DEFAULT false,
    execution_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_execution_time INTEGER DEFAULT 0, -- milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompt executions table for tracking results
CREATE TABLE IF NOT EXISTS prompt_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_template_id UUID REFERENCES prompt_templates(id) ON DELETE SET NULL,
    prompt_chain_id UUID REFERENCES prompt_chains(id) ON DELETE SET NULL,
    input_variables JSONB,
    final_prompt TEXT NOT NULL,
    ai_model VARCHAR(100) NOT NULL, -- 'openai-gpt-4', 'claude-3', etc.
    response_data JSONB, -- Full AI response
    execution_time INTEGER, -- milliseconds
    token_usage JSONB, -- prompt_tokens, completion_tokens, total_tokens
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, cancelled
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create prompt results table for storing individual step results in chains
CREATE TABLE IF NOT EXISTS prompt_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES prompt_executions(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_name VARCHAR(200),
    prompt_text TEXT NOT NULL,
    response_text TEXT,
    reasoning_data JSONB, -- extracted reasoning, questions, conclusions
    confidence_score DECIMAL(5,2),
    processing_time INTEGER, -- milliseconds for this step
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompt library favorites
CREATE TABLE IF NOT EXISTS prompt_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_template_id UUID REFERENCES prompt_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, prompt_template_id)
);

-- ==================================================
-- INDEXES FOR PERFORMANCE
-- ==================================================

-- Performance indexes (COMPREHENSIVE)
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_public ON prompt_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_prompt_templates_tags ON prompt_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_usage ON prompt_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_rating ON prompt_templates(rating_avg DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_chains_user_id ON prompt_chains(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_chains_config ON prompt_chains USING GIN(chain_config);
CREATE INDEX IF NOT EXISTS idx_prompt_chains_success ON prompt_chains(success_rate DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_executions_user_id ON prompt_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_template ON prompt_executions(prompt_template_id);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_chain ON prompt_executions(prompt_chain_id);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_status ON prompt_executions(status);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_created_at ON prompt_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_variables ON prompt_executions USING GIN(input_variables);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_response ON prompt_executions USING GIN(response_data);

CREATE INDEX IF NOT EXISTS idx_prompt_results_execution_id ON prompt_results(execution_id);
CREATE INDEX IF NOT EXISTS idx_prompt_results_step ON prompt_results(step_number);
CREATE INDEX IF NOT EXISTS idx_prompt_results_reasoning ON prompt_results USING GIN(reasoning_data);

CREATE INDEX IF NOT EXISTS idx_prompt_favorites_user_id ON prompt_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_favorites_template ON prompt_favorites(prompt_template_id);

-- ==================================================
-- ROW LEVEL SECURITY (RLS) - THIS FIXES YOUR ERRORS!
-- ==================================================

-- Enable Row Level Security
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompt_templates (COMPLETE CRUD)
DO $$ 
BEGIN
    -- SELECT policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_templates' AND policyname = 'Users can view their own and public prompt templates') THEN
        CREATE POLICY "Users can view their own and public prompt templates" ON prompt_templates
            FOR SELECT USING (auth.uid() = user_id OR is_public = true);
    END IF;
    
    -- INSERT policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_templates' AND policyname = 'Users can insert their own prompt templates') THEN
        CREATE POLICY "Users can insert their own prompt templates" ON prompt_templates
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- UPDATE policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_templates' AND policyname = 'Users can update their own prompt templates') THEN
        CREATE POLICY "Users can update their own prompt templates" ON prompt_templates
            FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- DELETE policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_templates' AND policyname = 'Users can delete their own prompt templates') THEN
        CREATE POLICY "Users can delete their own prompt templates" ON prompt_templates
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS Policies for prompt_chains (COMPLETE CRUD)
DO $$ 
BEGIN
    -- SELECT policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_chains' AND policyname = 'Users can view their own and public prompt chains') THEN
        CREATE POLICY "Users can view their own and public prompt chains" ON prompt_chains
            FOR SELECT USING (auth.uid() = user_id OR is_public = true);
    END IF;
    
    -- INSERT policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_chains' AND policyname = 'Users can insert their own prompt chains') THEN
        CREATE POLICY "Users can insert their own prompt chains" ON prompt_chains
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- UPDATE policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_chains' AND policyname = 'Users can update their own prompt chains') THEN
        CREATE POLICY "Users can update their own prompt chains" ON prompt_chains
            FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- DELETE policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_chains' AND policyname = 'Users can delete their own prompt chains') THEN
        CREATE POLICY "Users can delete their own prompt chains" ON prompt_chains
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS Policies for prompt_executions (COMPLETE CRUD)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_executions' AND policyname = 'Users can only access their own prompt executions') THEN
        CREATE POLICY "Users can only access their own prompt executions" ON prompt_executions
            FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- RLS Policies for prompt_results (COMPLETE CRUD)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_results' AND policyname = 'Users can only access their own prompt results') THEN
        CREATE POLICY "Users can only access their own prompt results" ON prompt_results
            FOR ALL USING (auth.uid() = (SELECT user_id FROM prompt_executions WHERE id = execution_id))
            WITH CHECK (auth.uid() = (SELECT user_id FROM prompt_executions WHERE id = execution_id));
    END IF;
END $$;

-- RLS Policies for prompt_favorites (COMPLETE CRUD)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_favorites' AND policyname = 'Users can only access their own prompt favorites') THEN
        CREATE POLICY "Users can only access their own prompt favorites" ON prompt_favorites
            FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- ==================================================
-- DATABASE FUNCTIONS AND TRIGGERS
-- ==================================================

-- Functions for prompt analytics
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

-- Trigger to update usage stats
DROP TRIGGER IF EXISTS trigger_update_prompt_usage_stats ON prompt_executions;
CREATE TRIGGER trigger_update_prompt_usage_stats
    AFTER INSERT ON prompt_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_prompt_usage_stats();

-- Function to calculate chain success rate
CREATE OR REPLACE FUNCTION update_chain_success_rate()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE prompt_chains 
        SET success_rate = (
            SELECT ROUND(
                (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)) * 100, 2
            )
            FROM prompt_executions 
            WHERE prompt_chain_id = NEW.prompt_chain_id
        ),
        avg_execution_time = (
            SELECT ROUND(AVG(execution_time))
            FROM prompt_executions 
            WHERE prompt_chain_id = NEW.prompt_chain_id AND status = 'completed'
        )
        WHERE id = NEW.prompt_chain_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update chain success rate
DROP TRIGGER IF EXISTS trigger_update_chain_success_rate ON prompt_executions;
CREATE TRIGGER trigger_update_chain_success_rate
    AFTER UPDATE ON prompt_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_chain_success_rate();

-- ==================================================
-- SAMPLE DATA (OPTIONAL - DELETE IF NOT WANTED)
-- ==================================================

-- Insert sample prompt templates (you can delete this section if not needed)
INSERT INTO prompt_templates (user_id, name, description, template, variables, category, tags, is_public) VALUES
('00000000-0000-0000-0000-000000000000', 'Research Paper Analysis', 'Analyze and summarize research papers', 
'Analyze the following research paper and provide:\n1. Main contributions\n2. Methodology\n3. Key findings\n4. Limitations\n5. Future work implications\n\nPaper: {{paper_text}}\n\nPlease structure your analysis clearly and highlight the most significant insights.', 
'[{"name": "paper_text", "type": "text", "required": true, "description": "Full text of the research paper"}]',
'research', ARRAY['analysis', 'research', 'academic'], true),

('00000000-0000-0000-0000-000000000000', 'Code Review Assistant', 'Comprehensive code review and improvement suggestions',
'Review the following {{language}} code and provide:\n1. Code quality assessment\n2. Potential bugs or issues\n3. Performance improvements\n4. Best practices recommendations\n5. Security considerations\n\nCode:\n```{{language}}\n{{code}}\n```\n\nProvide specific, actionable feedback with examples.',
'[{"name": "language", "type": "select", "options": ["JavaScript", "Python", "TypeScript", "Java", "Go"], "required": true}, {"name": "code", "type": "textarea", "required": true, "description": "Code to review"}]',
'development', ARRAY['code-review', 'programming', 'quality'], true),

('00000000-0000-0000-0000-000000000000', 'Meeting Notes Processor', 'Convert meeting transcripts into structured notes',
'Process the following meeting transcript and create structured notes with:\n1. **Key Decisions Made**\n2. **Action Items** (with assigned owners if mentioned)\n3. **Important Discussion Points**\n4. **Follow-up Questions**\n5. **Next Steps**\n\nMeeting: {{meeting_title}}\nDate: {{meeting_date}}\nTranscript: {{transcript}}\n\nFormat the output in clear, actionable sections.',
'[{"name": "meeting_title", "type": "text", "required": true}, {"name": "meeting_date", "type": "date", "required": false}, {"name": "transcript", "type": "textarea", "required": true}]',
'productivity', ARRAY['meetings', 'notes', 'organization'], true)
ON CONFLICT DO NOTHING;

-- ==================================================
-- MIGRATION COMPLETE!
-- ==================================================
-- 
-- After running this migration:
-- ✅ Your console errors should be gone
-- ✅ The /prompts page will work
-- ✅ All RLS policies are active
-- ✅ Performance is optimized
-- 
-- Questions? The migration creates these tables:
-- - prompt_templates (store prompt templates)
-- - prompt_chains (multi-step workflows)  
-- - prompt_executions (track AI responses)
-- - prompt_results (step-by-step results)
-- - prompt_favorites (user favorites)
--
-- ==================================================