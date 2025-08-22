-- Create user_hackathons table for personal hackathon tracking
CREATE TABLE IF NOT EXISTS user_hackathons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    is_favorite BOOLEAN DEFAULT false,
    reminder_set BOOLEAN DEFAULT false,
    reminder_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per user per hackathon
    UNIQUE(user_id, hackathon_id)
);

-- Add RLS (Row Level Security)
ALTER TABLE user_hackathons ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own saved hackathons
CREATE POLICY "Users can view own hackathons" ON user_hackathons
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hackathons" ON user_hackathons
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hackathons" ON user_hackathons
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own hackathons" ON user_hackathons
    FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX idx_user_hackathons_user_id ON user_hackathons(user_id);
CREATE INDEX idx_user_hackathons_hackathon_id ON user_hackathons(hackathon_id);
CREATE INDEX idx_user_hackathons_favorites ON user_hackathons(user_id, is_favorite);
CREATE INDEX idx_user_hackathons_reminders ON user_hackathons(user_id, reminder_set, reminder_date);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_hackathons_updated_at 
    BEFORE UPDATE ON user_hackathons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data (optional - remove if not needed)
COMMENT ON TABLE user_hackathons IS 'Personal hackathon tracking - saves, favorites, and reminders';
COMMENT ON COLUMN user_hackathons.is_favorite IS 'Whether user marked this hackathon as favorite';
COMMENT ON COLUMN user_hackathons.reminder_set IS 'Whether user set a reminder for this hackathon';
COMMENT ON COLUMN user_hackathons.reminder_date IS 'When to remind the user about this hackathon';
COMMENT ON COLUMN user_hackathons.notes IS 'Personal notes about the hackathon';