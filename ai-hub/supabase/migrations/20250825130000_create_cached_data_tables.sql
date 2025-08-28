-- Create cached data tables for weekly/daily scheduled updates
-- This enables cache-first approach with scheduled edge function runs

-- Cached stock data table
CREATE TABLE IF NOT EXISTS cached_stock_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  price DECIMAL(10,2),
  change_percent DECIMAL(5,2),
  data_source TEXT DEFAULT 'edge_function',
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  
  -- Constraints
  CONSTRAINT valid_price CHECK (price >= 0),
  CONSTRAINT valid_symbol CHECK (length(symbol) BETWEEN 1 AND 10)
);

-- Cached funding data table  
CREATE TABLE IF NOT EXISTS cached_funding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  funding_amount BIGINT,
  funding_round TEXT,
  industry TEXT,
  announcement_date TIMESTAMPTZ,
  data_source TEXT DEFAULT 'edge_function',
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  
  -- Constraints
  CONSTRAINT valid_funding_amount CHECK (funding_amount >= 0),
  CONSTRAINT valid_company_name CHECK (length(company_name) > 0)
);

-- Cached job data table
CREATE TABLE IF NOT EXISTS cached_job_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  salary_min INTEGER DEFAULT 0,
  salary_max INTEGER DEFAULT 0,
  experience_level TEXT,
  remote_friendly BOOLEAN DEFAULT false,
  data_source TEXT DEFAULT 'edge_function',
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  
  -- Constraints
  CONSTRAINT valid_salary CHECK (salary_min >= 0 AND salary_max >= salary_min),
  CONSTRAINT valid_role_title CHECK (length(role_title) > 0)
);

-- Cached AI content table
CREATE TABLE IF NOT EXISTS cached_ai_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_type TEXT,
  source TEXT,
  url TEXT,
  summary TEXT,
  tags JSONB DEFAULT '[]',
  data_source TEXT DEFAULT 'edge_function',
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  
  -- Constraints
  CONSTRAINT valid_title CHECK (length(title) > 0),
  CONSTRAINT valid_url CHECK (url IS NULL OR url ~ '^https?://')
);

-- Data refresh log table for tracking scheduled updates
CREATE TABLE IF NOT EXISTS data_refresh_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'error')),
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Constraints
  CONSTRAINT valid_records_count CHECK (records_updated >= 0),
  CONSTRAINT valid_function_name CHECK (length(function_name) > 0)
);

-- Performance indexes for cache tables
CREATE INDEX IF NOT EXISTS idx_cached_stock_data_expires_at ON cached_stock_data(expires_at);
CREATE INDEX IF NOT EXISTS idx_cached_stock_data_symbol ON cached_stock_data(symbol);
CREATE INDEX IF NOT EXISTS idx_cached_stock_data_cached_at ON cached_stock_data(cached_at DESC);

CREATE INDEX IF NOT EXISTS idx_cached_funding_data_expires_at ON cached_funding_data(expires_at);
CREATE INDEX IF NOT EXISTS idx_cached_funding_data_company ON cached_funding_data(company_name);
CREATE INDEX IF NOT EXISTS idx_cached_funding_data_industry ON cached_funding_data(industry);
CREATE INDEX IF NOT EXISTS idx_cached_funding_data_cached_at ON cached_funding_data(cached_at DESC);

CREATE INDEX IF NOT EXISTS idx_cached_job_data_expires_at ON cached_job_data(expires_at);
CREATE INDEX IF NOT EXISTS idx_cached_job_data_location ON cached_job_data(location);
CREATE INDEX IF NOT EXISTS idx_cached_job_data_remote ON cached_job_data(remote_friendly);
CREATE INDEX IF NOT EXISTS idx_cached_job_data_cached_at ON cached_job_data(cached_at DESC);

CREATE INDEX IF NOT EXISTS idx_cached_ai_content_expires_at ON cached_ai_content(expires_at);
CREATE INDEX IF NOT EXISTS idx_cached_ai_content_source ON cached_ai_content(source);
CREATE INDEX IF NOT EXISTS idx_cached_ai_content_type ON cached_ai_content(content_type);
CREATE INDEX IF NOT EXISTS idx_cached_ai_content_cached_at ON cached_ai_content(cached_at DESC);

-- Indexes for refresh log
CREATE INDEX IF NOT EXISTS idx_data_refresh_log_function ON data_refresh_log(function_name);
CREATE INDEX IF NOT EXISTS idx_data_refresh_log_status ON data_refresh_log(status);
CREATE INDEX IF NOT EXISTS idx_data_refresh_log_completed_at ON data_refresh_log(completed_at DESC);

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Clean up expired stock data
  DELETE FROM cached_stock_data WHERE expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean up expired funding data
  DELETE FROM cached_funding_data WHERE expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean up expired job data
  DELETE FROM cached_job_data WHERE expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean up expired AI content
  DELETE FROM cached_ai_content WHERE expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean up old refresh logs (keep last 1000 entries)
  DELETE FROM data_refresh_log 
  WHERE id NOT IN (
    SELECT id FROM data_refresh_log 
    ORDER BY completed_at DESC 
    LIMIT 1000
  );
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Log the cleanup
  INSERT INTO data_refresh_log (function_name, status, records_updated, completed_at)
  VALUES ('cleanup_expired_cache', 'success', deleted_count, NOW());
  
  RETURN deleted_count;
END;
$$;

-- Function to get cache statistics
CREATE OR REPLACE FUNCTION get_cache_statistics()
RETURNS TABLE (
  table_name TEXT,
  total_records INTEGER,
  expired_records INTEGER,
  fresh_records INTEGER,
  oldest_cache_age INTERVAL,
  newest_cache_age INTERVAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'cached_stock_data'::TEXT,
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN expires_at < NOW() THEN 1 END)::INTEGER,
    COUNT(CASE WHEN expires_at >= NOW() THEN 1 END)::INTEGER,
    CASE WHEN COUNT(*) > 0 THEN NOW() - MIN(cached_at) ELSE NULL END,
    CASE WHEN COUNT(*) > 0 THEN NOW() - MAX(cached_at) ELSE NULL END
  FROM cached_stock_data
  
  UNION ALL
  
  SELECT 
    'cached_funding_data'::TEXT,
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN expires_at < NOW() THEN 1 END)::INTEGER,
    COUNT(CASE WHEN expires_at >= NOW() THEN 1 END)::INTEGER,
    CASE WHEN COUNT(*) > 0 THEN NOW() - MIN(cached_at) ELSE NULL END,
    CASE WHEN COUNT(*) > 0 THEN NOW() - MAX(cached_at) ELSE NULL END
  FROM cached_funding_data
  
  UNION ALL
  
  SELECT 
    'cached_job_data'::TEXT,
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN expires_at < NOW() THEN 1 END)::INTEGER,
    COUNT(CASE WHEN expires_at >= NOW() THEN 1 END)::INTEGER,
    CASE WHEN COUNT(*) > 0 THEN NOW() - MIN(cached_at) ELSE NULL END,
    CASE WHEN COUNT(*) > 0 THEN NOW() - MAX(cached_at) ELSE NULL END
  FROM cached_job_data
  
  UNION ALL
  
  SELECT 
    'cached_ai_content'::TEXT,
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN expires_at < NOW() THEN 1 END)::INTEGER,
    COUNT(CASE WHEN expires_at >= NOW() THEN 1 END)::INTEGER,
    CASE WHEN COUNT(*) > 0 THEN NOW() - MIN(cached_at) ELSE NULL END,
    CASE WHEN COUNT(*) > 0 THEN NOW() - MAX(cached_at) ELSE NULL END
  FROM cached_ai_content;
END;
$$;

-- Function to refresh all cached data (calls edge functions)
CREATE OR REPLACE FUNCTION refresh_all_cached_data()
RETURNS TABLE (
  function_name TEXT,
  status TEXT,
  records_processed INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
BEGIN
  start_time := NOW();
  
  -- Log the start of refresh
  INSERT INTO data_refresh_log (function_name, status, started_at)
  VALUES ('refresh_all_cached_data', 'started', start_time);
  
  -- Note: In a real implementation, this would make HTTP calls to edge functions
  -- For now, we'll return a placeholder response
  -- The actual edge function calls would be made from the application layer
  
  end_time := NOW();
  
  -- Update the log with completion
  UPDATE data_refresh_log 
  SET 
    status = 'success',
    completed_at = end_time,
    duration_ms = EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
    records_updated = 0
  WHERE function_name = 'refresh_all_cached_data' 
    AND started_at = start_time;
  
  RETURN QUERY
  SELECT 
    'refresh_all_cached_data'::TEXT,
    'success'::TEXT,
    0::INTEGER,
    'Cache refresh function created - call from application layer'::TEXT;
END;
$$;

-- Add comments to tables for documentation
COMMENT ON TABLE cached_stock_data IS 'Cached stock market data with 24-hour expiration';
COMMENT ON TABLE cached_funding_data IS 'Cached startup funding data with 7-day expiration';
COMMENT ON TABLE cached_job_data IS 'Cached job market data with 7-day expiration';
COMMENT ON TABLE cached_ai_content IS 'Cached AI research content with 7-day expiration';
COMMENT ON TABLE data_refresh_log IS 'Log of scheduled data refresh operations';

COMMENT ON FUNCTION cleanup_expired_cache() IS 'Removes expired cache entries and old logs';
COMMENT ON FUNCTION get_cache_statistics() IS 'Returns statistics about cache table contents';
COMMENT ON FUNCTION refresh_all_cached_data() IS 'Placeholder function for triggering data refresh';

-- Create a view for easy cache status monitoring
CREATE OR REPLACE VIEW cache_status_summary AS
SELECT 
  'Stock Data' as data_type,
  COUNT(*) as total_records,
  COUNT(CASE WHEN expires_at >= NOW() THEN 1 END) as fresh_records,
  COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_records,
  MAX(cached_at) as last_updated,
  MIN(expires_at) as next_expiration
FROM cached_stock_data

UNION ALL

SELECT 
  'Funding Data',
  COUNT(*),
  COUNT(CASE WHEN expires_at >= NOW() THEN 1 END),
  COUNT(CASE WHEN expires_at < NOW() THEN 1 END),
  MAX(cached_at),
  MIN(expires_at)
FROM cached_funding_data

UNION ALL

SELECT 
  'Job Data',
  COUNT(*),
  COUNT(CASE WHEN expires_at >= NOW() THEN 1 END),
  COUNT(CASE WHEN expires_at < NOW() THEN 1 END),
  MAX(cached_at),
  MIN(expires_at)
FROM cached_job_data

UNION ALL

SELECT 
  'AI Content',
  COUNT(*),
  COUNT(CASE WHEN expires_at >= NOW() THEN 1 END),
  COUNT(CASE WHEN expires_at < NOW() THEN 1 END),
  MAX(cached_at),
  MIN(expires_at)
FROM cached_ai_content;

COMMENT ON VIEW cache_status_summary IS 'Summary view of cache table status and freshness';

-- Success message
SELECT 'Cached data tables and functions created successfully' as status;