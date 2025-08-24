-- Migration: create_startup_funding_table
-- Created at: 1755466125

CREATE TABLE public.startup_funding (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    funding_amount BIGINT,
    funding_round VARCHAR(100),
    announcement_date TIMESTAMPTZ,
    source_url TEXT UNIQUE,
    description TEXT,
    investors TEXT[] DEFAULT '{}',
    industry VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.startup_funding ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access" ON public.startup_funding FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert" ON public.startup_funding FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON public.startup_funding FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete" ON public.startup_funding FOR DELETE USING (true);

-- Create index for better performance
CREATE INDEX idx_startup_funding_company_name ON public.startup_funding(company_name);
CREATE INDEX idx_startup_funding_announcement_date ON public.startup_funding(announcement_date);
CREATE INDEX idx_startup_funding_funding_amount ON public.startup_funding(funding_amount);;