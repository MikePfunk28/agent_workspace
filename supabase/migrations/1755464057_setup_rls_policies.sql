-- Migration: setup_rls_policies
-- Created at: 1755464057

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects
CREATE POLICY "project_access_policy" ON projects
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for knowledge items
CREATE POLICY "knowledge_access_policy" ON knowledge_items
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for newsletters
CREATE POLICY "newsletter_access_policy" ON newsletters
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for prompt library - SELECT can access public prompts
CREATE POLICY "prompt_select_policy" ON prompt_library
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "prompt_modify_policy" ON prompt_library
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prompt_update_policy" ON prompt_library
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prompt_delete_policy" ON prompt_library
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user analytics
CREATE POLICY "analytics_access_policy" ON user_analytics
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);;