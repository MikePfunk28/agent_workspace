-- Migration: Create Prompt Management System
-- Created at: 20250819152000

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create prompt templates table
CREATE TABLE prompt_templates (
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
    rating_avg DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompt chains table for multi-step reasoning
CREATE TABLE prompt_chains (
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
CREATE TABLE prompt_executions (
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
CREATE TABLE prompt_results (
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
CREATE TABLE prompt_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_template_id UUID REFERENCES prompt_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, prompt_template_id)
);

-- Create indexes for performance
CREATE INDEX idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX idx_prompt_templates_public ON prompt_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_prompt_templates_tags ON prompt_templates USING GIN(tags);
CREATE INDEX idx_prompt_chains_user_id ON prompt_chains(user_id);
CREATE INDEX idx_prompt_executions_user_id ON prompt_executions(user_id);
CREATE INDEX idx_prompt_executions_created_at ON prompt_executions(created_at DESC);
CREATE INDEX idx_prompt_results_execution_id ON prompt_results(execution_id);
CREATE INDEX idx_prompt_favorites_user_id ON prompt_favorites(user_id);

-- Enable Row Level Security
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompt_templates
CREATE POLICY "Users can view their own and public prompt templates" ON prompt_templates
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own prompt templates" ON prompt_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompt templates" ON prompt_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompt templates" ON prompt_templates
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for prompt_chains
CREATE POLICY "Users can view their own and public prompt chains" ON prompt_chains
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own prompt chains" ON prompt_chains
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompt chains" ON prompt_chains
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompt chains" ON prompt_chains
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for prompt_executions
CREATE POLICY "Users can only access their own prompt executions" ON prompt_executions
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for prompt_results
CREATE POLICY "Users can only access their own prompt results" ON prompt_results
    FOR ALL USING (auth.uid() = (SELECT user_id FROM prompt_executions WHERE id = execution_id));

-- RLS Policies for prompt_favorites
CREATE POLICY "Users can only access their own prompt favorites" ON prompt_favorites
    FOR ALL USING (auth.uid() = user_id);

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
CREATE TRIGGER trigger_update_chain_success_rate
    AFTER UPDATE ON prompt_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_chain_success_rate();

-- Insert sample prompt templates
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
'productivity', ARRAY['meetings', 'notes', 'organization'], true);