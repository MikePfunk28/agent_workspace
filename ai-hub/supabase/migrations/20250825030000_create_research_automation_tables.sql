-- Migration: Create Research Automation System Tables
-- Created: 2025-08-25
-- Purpose: Support the Research Automation system with domain knowledge, learning data, and adaptive templates

-- Create domain_knowledge table for storing research findings
CREATE TABLE IF NOT EXISTS domain_knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  user_intent TEXT NOT NULL,
  methodologies JSONB DEFAULT '[]'::jsonb,
  best_practices JSONB DEFAULT '[]'::jsonb,
  common_patterns JSONB DEFAULT '[]'::jsonb,
  validation_rules JSONB DEFAULT '[]'::jsonb,
  tools_and_techniques JSONB DEFAULT '[]'::jsonb,
  source_count INTEGER DEFAULT 0,
  confidence_score DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create extracted_knowledge table for knowledge extraction results
CREATE TABLE IF NOT EXISTS extracted_knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  workflows JSONB DEFAULT '[]'::jsonb,
  prompts JSONB DEFAULT '[]'::jsonb,
  validation_rules JSONB DEFAULT '[]'::jsonb,
  agents JSONB DEFAULT '[]'::jsonb,
  patterns JSONB DEFAULT '[]'::jsonb,
  best_practices JSONB DEFAULT '[]'::jsonb,
  confidence DECIMAL(3,2) DEFAULT 0.00,
  completeness DECIMAL(3,2) DEFAULT 0.00,
  sources_processed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learned_patterns table for workflow learning results
CREATE TABLE IF NOT EXISTS learned_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  patterns JSONB NOT NULL,
  insights JSONB NOT NULL,
  pattern_count INTEGER DEFAULT 0,
  confidence_score DECIMAL(3,2) DEFAULT 0.00,
  improvement_potential DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create adaptive_templates table for dynamic workflow templates
CREATE TABLE IF NOT EXISTS adaptive_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  base_workflow JSONB NOT NULL,
  adaptation_rules JSONB DEFAULT '[]'::jsonb,
  model_adaptations JSONB DEFAULT '{}'::jsonb,
  validation_schemas JSONB DEFAULT '[]'::jsonb,
  version TEXT DEFAULT '1.0.0',
  is_public BOOLEAN DEFAULT FALSE,
  rating DECIMAL(2,1) DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2) DEFAULT 0.00,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  learned_from TEXT[] DEFAULT ARRAY[]::TEXT[],
  optimization_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'system'
);

-- Create workflow_executions table for tracking execution performance
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  template_id UUID REFERENCES adaptive_templates(id) ON DELETE SET NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused')),
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- milliseconds
  current_step TEXT,
  completed_steps TEXT[] DEFAULT ARRAY[]::TEXT[],
  failed_steps TEXT[] DEFAULT ARRAY[]::TEXT[],
  step_outputs JSONB DEFAULT '{}'::jsonb,
  validation_results JSONB DEFAULT '{}'::jsonb,
  total_tokens_used INTEGER DEFAULT 0,
  cost_estimate DECIMAL(8,4) DEFAULT 0.0000,
  errors JSONB DEFAULT '[]'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create template_performance table for tracking template usage and performance
CREATE TABLE IF NOT EXISTS template_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES adaptive_templates(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
  success_rate DECIMAL(3,2) DEFAULT 0.00,
  avg_duration INTEGER DEFAULT 0,
  token_efficiency DECIMAL(5,2) DEFAULT 0.00,
  user_satisfaction DECIMAL(2,1) DEFAULT 0.0,
  error_rate DECIMAL(3,2) DEFAULT 0.00,
  feedback JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated_workflows table for tracking research-generated workflows
CREATE TABLE IF NOT EXISTS generated_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  user_intent TEXT NOT NULL,
  research_sources INTEGER DEFAULT 0,
  methodology_names TEXT[] DEFAULT ARRAY[]::TEXT[],
  similar_workflow_ids UUID[] DEFAULT ARRAY[]::UUID[],
  confidence_score DECIMAL(3,2) DEFAULT 0.00,
  performance_prediction JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create research_feedback table for continuous improvement
CREATE TABLE IF NOT EXISTS research_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  issues TEXT[] DEFAULT ARRAY[]::TEXT[],
  suggestions TEXT[] DEFAULT ARRAY[]::TEXT[],
  improvement_areas JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_domain_knowledge_domain ON domain_knowledge(domain);
CREATE INDEX IF NOT EXISTS idx_domain_knowledge_created_at ON domain_knowledge(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_extracted_knowledge_domain ON extracted_knowledge(domain);
CREATE INDEX IF NOT EXISTS idx_extracted_knowledge_confidence ON extracted_knowledge(confidence DESC);

CREATE INDEX IF NOT EXISTS idx_learned_patterns_domain ON learned_patterns(domain);
CREATE INDEX IF NOT EXISTS idx_learned_patterns_confidence ON learned_patterns(confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_adaptive_templates_domain ON adaptive_templates(domain);
CREATE INDEX IF NOT EXISTS idx_adaptive_templates_category ON adaptive_templates(category);
CREATE INDEX IF NOT EXISTS idx_adaptive_templates_rating ON adaptive_templates(rating DESC);
CREATE INDEX IF NOT EXISTS idx_adaptive_templates_usage ON adaptive_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_adaptive_templates_public ON adaptive_templates(is_public) WHERE is_public = TRUE;

CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_domain ON workflow_executions(domain);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created_at ON workflow_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_id ON workflow_executions(user_id);

CREATE INDEX IF NOT EXISTS idx_template_performance_template_id ON template_performance(template_id);
CREATE INDEX IF NOT EXISTS idx_template_performance_success_rate ON template_performance(success_rate DESC);

CREATE INDEX IF NOT EXISTS idx_generated_workflows_domain ON generated_workflows(domain);
CREATE INDEX IF NOT EXISTS idx_generated_workflows_confidence ON generated_workflows(confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_research_feedback_rating ON research_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_research_feedback_created_at ON research_feedback(created_at DESC);

-- Create GIN indexes for JSONB columns for fast JSON queries
CREATE INDEX IF NOT EXISTS idx_domain_knowledge_methodologies_gin ON domain_knowledge USING GIN (methodologies);
CREATE INDEX IF NOT EXISTS idx_extracted_knowledge_patterns_gin ON extracted_knowledge USING GIN (patterns);
CREATE INDEX IF NOT EXISTS idx_adaptive_templates_base_workflow_gin ON adaptive_templates USING GIN (base_workflow);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_step_outputs_gin ON workflow_executions USING GIN (step_outputs);

-- Create full-text search indexes for better search capability
CREATE INDEX IF NOT EXISTS idx_domain_knowledge_intent_fts ON domain_knowledge USING GIN (to_tsvector('english', user_intent));
CREATE INDEX IF NOT EXISTS idx_adaptive_templates_name_fts ON adaptive_templates USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_adaptive_templates_description_fts ON adaptive_templates USING GIN (to_tsvector('english', description));

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_domain_knowledge_updated_at BEFORE UPDATE ON domain_knowledge 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_adaptive_templates_updated_at BEFORE UPDATE ON adaptive_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for security
ALTER TABLE domain_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptive_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_feedback ENABLE ROW LEVEL SECURITY;

-- Allow read access to public templates
CREATE POLICY "Public templates are viewable by everyone" ON adaptive_templates
    FOR SELECT USING (is_public = TRUE);

-- Allow users to view their own executions and feedback
CREATE POLICY "Users can view own executions" ON workflow_executions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own feedback" ON research_feedback
    FOR ALL USING (auth.uid() = user_id);

-- Allow authenticated users to read research data for learning
CREATE POLICY "Authenticated users can read research data" ON domain_knowledge
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can read extracted knowledge" ON extracted_knowledge
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can read learned patterns" ON learned_patterns
    FOR SELECT TO authenticated USING (TRUE);

-- System can write to all tables (for the research automation service)
CREATE POLICY "System can write domain knowledge" ON domain_knowledge
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "System can write extracted knowledge" ON extracted_knowledge
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "System can write learned patterns" ON learned_patterns
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "System can manage templates" ON adaptive_templates
    FOR ALL USING (TRUE);

CREATE POLICY "System can manage executions" ON workflow_executions
    FOR ALL USING (TRUE);

CREATE POLICY "System can track performance" ON template_performance
    FOR ALL USING (TRUE);

CREATE POLICY "System can track generated workflows" ON generated_workflows
    FOR ALL USING (TRUE);

-- Create materialized view for research analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS research_analytics AS
SELECT 
    domain,
    COUNT(*) as total_workflows,
    AVG(confidence_score) as avg_confidence,
    SUM(research_sources) as total_sources_analyzed,
    AVG(ARRAY_LENGTH(methodology_names, 1)) as avg_methodologies_per_workflow,
    DATE_TRUNC('day', created_at) as date
FROM generated_workflows 
GROUP BY domain, DATE_TRUNC('day', created_at)
ORDER BY date DESC, total_workflows DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_analytics_unique 
ON research_analytics (domain, date);

-- Create materialized view for template performance analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS template_analytics AS
SELECT 
    t.id as template_id,
    t.name,
    t.domain,
    t.category,
    t.usage_count,
    t.success_rate,
    t.rating,
    AVG(p.avg_duration) as avg_execution_time,
    AVG(p.token_efficiency) as avg_token_efficiency,
    AVG(p.user_satisfaction) as avg_user_satisfaction,
    COUNT(p.id) as performance_records
FROM adaptive_templates t
LEFT JOIN template_performance p ON t.id = p.template_id
GROUP BY t.id, t.name, t.domain, t.category, t.usage_count, t.success_rate, t.rating;

CREATE UNIQUE INDEX IF NOT EXISTS idx_template_analytics_unique 
ON template_analytics (template_id);

-- Create function to refresh analytics views
CREATE OR REPLACE FUNCTION refresh_research_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY research_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY template_analytics;
END;
$$ LANGUAGE plpgsql;

-- Create function to get system health metrics
CREATE OR REPLACE FUNCTION get_research_system_health()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_domains', (SELECT COUNT(DISTINCT domain) FROM domain_knowledge),
        'total_templates', (SELECT COUNT(*) FROM adaptive_templates),
        'total_executions', (SELECT COUNT(*) FROM workflow_executions),
        'success_rate', (
            SELECT COALESCE(
                AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 
                0
            ) FROM workflow_executions WHERE created_at >= NOW() - INTERVAL '30 days'
        ),
        'avg_confidence', (SELECT COALESCE(AVG(confidence_score), 0) FROM domain_knowledge),
        'top_domains', (
            SELECT json_agg(json_build_object('domain', domain, 'count', count))
            FROM (
                SELECT domain, COUNT(*) as count 
                FROM generated_workflows 
                GROUP BY domain 
                ORDER BY count DESC 
                LIMIT 5
            ) top_domains
        ),
        'recent_activity', (
            SELECT COUNT(*) FROM workflow_executions 
            WHERE created_at >= NOW() - INTERVAL '24 hours'
        ),
        'last_updated', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE domain_knowledge IS 'Stores research findings and domain-specific knowledge extracted from various sources';
COMMENT ON TABLE extracted_knowledge IS 'Stores structured knowledge extracted from research papers, repositories, and other sources';
COMMENT ON TABLE learned_patterns IS 'Stores patterns learned from successful workflow executions for future optimization';
COMMENT ON TABLE adaptive_templates IS 'Dynamic workflow templates that adapt based on model capabilities and learned patterns';
COMMENT ON TABLE workflow_executions IS 'Tracks execution performance and results for learning and optimization';
COMMENT ON TABLE template_performance IS 'Tracks performance metrics for adaptive templates to enable continuous improvement';
COMMENT ON TABLE generated_workflows IS 'Tracks workflows generated by the research automation system';
COMMENT ON TABLE research_feedback IS 'Collects user feedback for continuous system improvement';

COMMENT ON FUNCTION get_research_system_health() IS 'Returns comprehensive health metrics for the research automation system';
COMMENT ON FUNCTION refresh_research_analytics() IS 'Refreshes materialized views for research and template analytics';

-- Grant necessary permissions
GRANT SELECT ON research_analytics TO authenticated;
GRANT SELECT ON template_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_research_system_health() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_research_analytics() TO service_role;

-- Create scheduled job to refresh analytics (if pg_cron is available)
-- This would typically be set up separately in the database
-- SELECT cron.schedule('refresh-research-analytics', '0 1 * * *', 'SELECT refresh_research_analytics();');