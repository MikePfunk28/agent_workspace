-- Migration: add_read_status_and_reminders
-- Created at: 1755466200

-- Add read status to knowledge_items table
ALTER TABLE knowledge_items 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE;

-- Add read status to ai_content table
ALTER TABLE ai_content 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE;

-- Create hackathon reminders table
CREATE TABLE hackathon_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hackathon_id UUID REFERENCES hackathons(id) ON DELETE CASCADE,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_type TEXT DEFAULT 'before_event', -- 'before_event', 'day_of', 'custom'
  is_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_knowledge_items_read_status ON knowledge_items(user_id, is_read);
CREATE INDEX idx_ai_content_read_status ON ai_content(user_id, is_read);
CREATE INDEX idx_hackathon_reminders_user_id ON hackathon_reminders(user_id);
CREATE INDEX idx_hackathon_reminders_date ON hackathon_reminders(reminder_date);

-- Enable Row Level Security (RLS)
ALTER TABLE hackathon_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for hackathon reminders
CREATE POLICY "Users can only access their own hackathon reminders" ON hackathon_reminders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only modify their own hackathon reminders" ON hackathon_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own hackathon reminders" ON hackathon_reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own hackathon reminders" ON hackathon_reminders
  FOR DELETE USING (auth.uid() = user_id);