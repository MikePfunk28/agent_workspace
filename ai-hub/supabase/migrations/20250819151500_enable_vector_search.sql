-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table for storing vector representations of content
CREATE TABLE IF NOT EXISTS content_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('ai_content', 'knowledge_items', 'hackathons')),
    title TEXT NOT NULL,
    content_text TEXT,
    embedding vector(1536), -- OpenAI Ada-002 embedding dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_embeddings_content_id ON content_embeddings(content_id);
CREATE INDEX IF NOT EXISTS idx_content_embeddings_content_type ON content_embeddings(content_type);
CREATE INDEX IF NOT EXISTS idx_content_embeddings_created_at ON content_embeddings(created_at DESC);

-- Create HNSW index for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_content_embeddings_hnsw 
ON content_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Alternative IVFFlat index (more memory efficient for smaller datasets)
CREATE INDEX IF NOT EXISTS idx_content_embeddings_ivfflat 
ON content_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_content_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_embeddings_updated_at 
    BEFORE UPDATE ON content_embeddings 
    FOR EACH ROW EXECUTE FUNCTION update_content_embeddings_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE content_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS policies - everyone can read embeddings (for semantic search)
CREATE POLICY "Allow read access to embeddings" ON content_embeddings
    FOR SELECT USING (true);

-- Only authenticated users can insert/update embeddings (for edge functions)
CREATE POLICY "Service role can manage embeddings" ON content_embeddings
    FOR ALL USING (auth.role() = 'service_role');

-- Create function for semantic search
CREATE OR REPLACE FUNCTION semantic_search(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 20,
    filter_content_type text DEFAULT null
)
RETURNS TABLE (
    id uuid,
    content_id uuid,
    content_type varchar(50),
    title text,
    content_text text,
    metadata jsonb,
    similarity float,
    created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        e.id,
        e.content_id,
        e.content_type,
        e.title,
        e.content_text,
        e.metadata,
        1 - (e.embedding <=> query_embedding) AS similarity,
        e.created_at
    FROM content_embeddings e
    WHERE 
        (filter_content_type IS NULL OR e.content_type = filter_content_type)
        AND (1 - (e.embedding <=> query_embedding)) >= match_threshold
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Create function for hybrid search (semantic + keyword)
CREATE OR REPLACE FUNCTION hybrid_search(
    query_text text,
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 20,
    filter_content_type text DEFAULT null
)
RETURNS TABLE (
    id uuid,
    content_id uuid,
    content_type varchar(50),
    title text,
    content_text text,
    metadata jsonb,
    semantic_similarity float,
    keyword_rank float,
    combined_score float,
    created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
    WITH semantic_results AS (
        SELECT 
            e.id,
            e.content_id,
            e.content_type,
            e.title,
            e.content_text,
            e.metadata,
            e.created_at,
            (1 - (e.embedding <=> query_embedding)) AS semantic_similarity
        FROM content_embeddings e
        WHERE 
            (filter_content_type IS NULL OR e.content_type = filter_content_type)
            AND (1 - (e.embedding <=> query_embedding)) >= match_threshold
    ),
    keyword_results AS (
        SELECT 
            e.id,
            ts_rank(
                to_tsvector('english', coalesce(e.title, '') || ' ' || coalesce(e.content_text, '')),
                plainto_tsquery('english', query_text)
            ) AS keyword_rank
        FROM content_embeddings e
        WHERE 
            (filter_content_type IS NULL OR e.content_type = filter_content_type)
            AND (
                to_tsvector('english', coalesce(e.title, '') || ' ' || coalesce(e.content_text, ''))
                @@ plainto_tsquery('english', query_text)
            )
    )
    SELECT 
        s.id,
        s.content_id,
        s.content_type,
        s.title,
        s.content_text,
        s.metadata,
        s.semantic_similarity,
        COALESCE(k.keyword_rank, 0) AS keyword_rank,
        -- Combine semantic and keyword scores (60% semantic, 40% keyword)
        (s.semantic_similarity * 0.6 + COALESCE(k.keyword_rank, 0) * 0.4) AS combined_score,
        s.created_at
    FROM semantic_results s
    LEFT JOIN keyword_results k ON s.id = k.id
    ORDER BY combined_score DESC
    LIMIT match_count;
$$;

-- Create indexes for full-text search
CREATE INDEX IF NOT EXISTS idx_content_embeddings_fts 
ON content_embeddings 
USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content_text, '')));

-- Add comments for documentation
COMMENT ON TABLE content_embeddings IS 'Stores vector embeddings for semantic search across AI Hub content';
COMMENT ON COLUMN content_embeddings.content_id IS 'Reference to the original content (ai_content, knowledge_items, etc.)';
COMMENT ON COLUMN content_embeddings.content_type IS 'Type of content: ai_content, knowledge_items, hackathons';
COMMENT ON COLUMN content_embeddings.embedding IS 'OpenAI Ada-002 vector embedding (1536 dimensions)';
COMMENT ON COLUMN content_embeddings.metadata IS 'Additional metadata like authors, tags, source, etc.';
COMMENT ON FUNCTION semantic_search IS 'Performs semantic similarity search using vector embeddings';
COMMENT ON FUNCTION hybrid_search IS 'Combines semantic and keyword search for better results';

-- Create view for easy content lookup with embeddings
CREATE OR REPLACE VIEW content_with_embeddings AS
SELECT 
    ac.id as original_id,
    ac.title,
    ac.content,
    ac.summary,
    ac.url,
    ac.source,
    ac.content_type as original_content_type,
    ac.authors,
    ac.published_at,
    ac.relevance_score,
    ac.created_at as content_created_at,
    ce.id as embedding_id,
    ce.embedding,
    ce.metadata as embedding_metadata,
    ce.created_at as embedding_created_at,
    CASE WHEN ce.id IS NOT NULL THEN true ELSE false END as has_embedding
FROM ai_content ac
LEFT JOIN content_embeddings ce ON ac.id = ce.content_id AND ce.content_type = 'ai_content'

UNION ALL

SELECT 
    ki.id as original_id,
    ki.title,
    ki.content,
    NULL as summary,
    ki.source_url as url,
    'knowledge_item' as source,
    ki.item_type as original_content_type,
    ARRAY[]::text[] as authors,
    NULL as published_at,
    NULL as relevance_score,
    ki.created_at as content_created_at,
    ce.id as embedding_id,
    ce.embedding,
    ce.metadata as embedding_metadata,
    ce.created_at as embedding_created_at,
    CASE WHEN ce.id IS NOT NULL THEN true ELSE false END as has_embedding
FROM knowledge_items ki
LEFT JOIN content_embeddings ce ON ki.id = ce.content_id AND ce.content_type = 'knowledge_items';

COMMENT ON VIEW content_with_embeddings IS 'Unified view of all searchable content with their embeddings';