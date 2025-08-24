-- Fixed Advanced Database Enhancement Script with additional error handling

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Ensure required extensions are installed
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS ltree SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;

-- Check if tables exist before modifying them
DO $$
DECLARE
    projects_exists BOOLEAN;
    prompt_templates_exists BOOLEAN;
    ai_content_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'projects'
    ) INTO projects_exists;

    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'prompt_templates'
    ) INTO prompt_templates_exists;

    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ai_content'
    ) INTO ai_content_exists;

    -- 1. Enhance Projects Table if it exists
    IF projects_exists THEN
        -- Ensure updated_at column exists for the trigger
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

        -- Add enhancement columns
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS category_path ltree,
        ADD COLUMN IF NOT EXISTS semantic_embedding vector(384),
        ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id),
        ADD COLUMN IF NOT EXISTS progress_metadata jsonb DEFAULT '{}';
    ELSE
        RAISE NOTICE 'Table projects does not exist. Skipping enhancement.';
    END IF;

    -- 2. Enhance Prompt Templates Table if it exists
    IF prompt_templates_exists THEN
        -- Ensure columns needed for search_vector exist
        ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS name text;
        ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS template text;
        ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[];
        ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

        -- Add enhancement columns
        ALTER TABLE prompt_templates
        ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
            to_tsvector('english',
                coalesce(name, '') || ' ' ||
                coalesce(template, '') || ' ' ||
                coalesce(array_to_string(tags, ' '), '')
            )
        ) STORED,
        ADD COLUMN IF NOT EXISTS category_path ltree,
        ADD COLUMN IF NOT EXISTS semantic_embedding vector(384),
        ADD COLUMN IF NOT EXISTS difficulty_level text
            CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'));
    ELSE
        RAISE NOTICE 'Table prompt_templates does not exist. Skipping enhancement.';
    END IF;

    -- 3. Enhance AI Content Table if it exists
    IF ai_content_exists THEN
        -- Ensure title column exists for the semantic search function
        ALTER TABLE ai_content ADD COLUMN IF NOT EXISTS title text;

        -- Add enhancement columns
        ALTER TABLE ai_content
        ADD COLUMN IF NOT EXISTS semantic_embedding vector(384),
        ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[],
        ADD COLUMN IF NOT EXISTS relevance_score decimal(5,2) DEFAULT 0;
    ELSE
        RAISE NOTICE 'Table ai_content does not exist. Skipping enhancement.';
    END IF;
END$$;

-- Semantic Search Function for AI Content
CREATE OR REPLACE FUNCTION public.semantic_ai_content_search(
    query_embedding vector(384),
    similarity_threshold float DEFAULT 0.7
)
RETURNS TABLE (
    id uuid,
    title text,
    similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check if ai_content table exists
    IF NOT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ai_content'
    ) THEN
        RAISE EXCEPTION 'Table ai_content does not exist';
    END IF;

    RETURN QUERY
    SELECT
        ac.id,
        ac.title,
        1 - (ac.semantic_embedding <=> query_embedding) AS similarity
    FROM public.ai_content ac
    WHERE ac.semantic_embedding IS NOT NULL
    AND 1 - (ac.semantic_embedding <=> query_embedding) > similarity_threshold
    ORDER BY similarity DESC
    LIMIT 10;
END;
$$;

-- Create Indexes for Enhanced Search (only if tables exist)
DO $$
BEGIN
    -- Check if prompt_templates exists before creating indexes
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'prompt_templates'
    ) THEN
        -- Check if search_vector column exists
        IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'prompt_templates' AND column_name = 'search_vector'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_prompt_templates_search
            ON prompt_templates USING gin(search_vector);
        END IF;

        -- Check if category_path column exists
        IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'prompt_templates' AND column_name = 'category_path'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_prompt_templates_category_path
            ON prompt_templates USING gist(category_path);
        END IF;

        -- Check if semantic_embedding column exists
        IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'prompt_templates' AND column_name = 'semantic_embedding'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_prompt_templates_embedding
            ON prompt_templates USING ivfflat (semantic_embedding vector_cosine_ops);
        END IF;
    END IF;

    -- Check if ai_content exists before creating indexes
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ai_content'
    ) AND EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ai_content' AND column_name = 'semantic_embedding'
    ) THEN
        -- Check for existing index to avoid duplicates
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE tablename = 'ai_content' AND indexname = 'ai_content_embedding_idx'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_ai_content_embedding
            ON ai_content USING ivfflat (semantic_embedding vector_cosine_ops);
        END IF;
    END IF;
END$$;

-- Password Strength Validation Function
CREATE OR REPLACE FUNCTION validate_password(password text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    has_uppercase boolean := false;
    has_lowercase boolean := false;
    has_number boolean := false;
    has_special boolean := false;
BEGIN
    -- Check length
    IF length(password) < 12 THEN
        RETURN false;
    END IF;

    -- Check for character types
    has_uppercase := password ~ '[A-Z]';
    has_lowercase := password ~ '[a-z]';
    has_number := password ~ '[0-9]';
    has_special := password ~ '[!@#$%^&*()_+\-=\[\]{};:''",.<>/?]';

    -- Require at least 3 of 4 character types
    RETURN
        (has_uppercase::int +
         has_lowercase::int +
         has_number::int +
         has_special::int) >= 3;
END;
$$;

-- Update Metadata Tracking Function
CREATE OR REPLACE FUNCTION set_updated_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure updated_at and updated_by columns exist in the table being updated
    IF TG_TABLE_NAME::regclass::text = 'public.projects' OR TG_TABLE_NAME::regclass::text = 'public.prompt_templates' THEN
        NEW.updated_at = now();

        -- Check if updated_by column exists in the target table
        IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = TG_TABLE_NAME::text AND column_name = 'updated_by'
        ) THEN
            NEW.updated_by = (SELECT auth.uid());
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Create Triggers for Metadata Tracking (only if tables exist)
DO $$
BEGIN
    -- Check if projects table exists
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'projects'
    ) AND EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'updated_at'
    ) THEN
        -- Projects Trigger
        IF NOT EXISTS (
            SELECT 1
            FROM pg_trigger
            WHERE tgname = 'trg_projects_updated_metadata'
        ) THEN
            CREATE TRIGGER trg_projects_updated_metadata
            BEFORE UPDATE ON projects
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_metadata();
        END IF;
    END IF;

    -- Check if prompt_templates table exists
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'prompt_templates'
    ) AND EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'prompt_templates' AND column_name = 'updated_at'
    ) THEN
        -- Prompt Templates Trigger
        IF NOT EXISTS (
            SELECT 1
            FROM pg_trigger
            WHERE tgname = 'trg_prompt_templates_updated_metadata'
        ) THEN
            CREATE TRIGGER trg_prompt_templates_updated_metadata
            BEFORE UPDATE ON prompt_templates
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_metadata();
        END IF;
    END IF;
END$$;

-- Optional: Hierarchical Category Exploration Function
CREATE OR REPLACE FUNCTION get_prompt_subcategories(parent_path text)
RETURNS TABLE (
    id uuid,
    name text,
    full_path text
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if prompt_templates table exists
    IF NOT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'prompt_templates'
    ) THEN
        RAISE EXCEPTION 'Table prompt_templates does not exist';
    END IF;

    RETURN QUERY
    SELECT
        pt.id,
        pt.name,
        pt.category_path::text
    FROM prompt_templates pt
    WHERE pt.category_path <@ parent_path::ltree;
END;
$$;

SELECT 'Database Enhanced Successfully' AS status;