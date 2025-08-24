-- =============================================
-- Advanced Search Features for AI Hub
-- =============================================
-- This migration adds pg_trgm (fuzzy search) and ltree (hierarchical categories)
-- to the existing AI Hub prompt_templates table while respecting existing RLS policies

-- =======================
-- 1. pg_trgm Extension Setup
-- =======================

-- Ensure extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Install pg_trgm extension for fuzzy matching in extensions schema
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Add GIN index for fast trigram text search on existing prompt_templates
CREATE INDEX IF NOT EXISTS idx_prompt_templates_gin
ON prompt_templates
USING gin (name gin_trgm_ops, description gin_trgm_ops);

-- Add generated full-text search column to existing table
ALTER TABLE prompt_templates
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
) STORED;

-- Create GIN index on the generated search vector
CREATE INDEX IF NOT EXISTS idx_prompt_templates_search
ON prompt_templates
USING gin(search_vector);

-- Fuzzy search function that respects existing RLS policies
CREATE OR REPLACE FUNCTION fuzzy_prompt_search(search_term text)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    similarity_score float
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        pt.id,
        pt.name,
        pt.description,
        GREATEST(
            extensions.similarity(pt.name, search_term),
            extensions.similarity(coalesce(pt.description, ''), search_term)
        ) AS similarity_score
    FROM prompt_templates pt
    WHERE
        -- Apply existing RLS policy logic manually in function
        (pt.is_public = true OR (SELECT auth.uid()) = pt.user_id)
        AND (
            extensions.similarity(pt.name, search_term) > 0.3
            OR extensions.similarity(coalesce(pt.description, ''), search_term) > 0.3
        )
    ORDER BY similarity_score DESC
    LIMIT 20;
END;
$$;

-- Full-text search function that respects existing RLS policies
CREATE OR REPLACE FUNCTION full_text_prompt_search(query_text text)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    rank_score float
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        pt.id,
        pt.name,
        pt.description,
        ts_rank(pt.search_vector, plainto_tsquery('english', query_text)) AS rank_score
    FROM prompt_templates pt
    WHERE
        -- Apply existing RLS policy logic manually in function
        (pt.is_public = true OR (SELECT auth.uid()) = pt.user_id)
        AND pt.search_vector @@ plainto_tsquery('english', query_text)
    ORDER BY rank_score DESC
    LIMIT 20;
END;
$$;

-- =======================
-- 2. ltree Extension Setup
-- =======================

-- Install ltree extension for hierarchical categorization in extensions schema
CREATE EXTENSION IF NOT EXISTS ltree SCHEMA extensions;

-- Add ltree column to existing prompt_templates table
ALTER TABLE prompt_templates
ADD COLUMN IF NOT EXISTS category_path ltree;

-- Create GiST index for efficient ltree queries
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category_path
ON prompt_templates USING gist(category_path);

-- Update existing templates with hierarchical category paths based on existing category field
UPDATE prompt_templates
SET category_path = CASE
    WHEN category = 'development' OR category = 'coding' THEN 'skills.programming.development'::ltree
    WHEN category = 'research' OR category = 'academic' THEN 'skills.academic.research'::ltree
    WHEN category = 'productivity' OR category = 'workflow' THEN 'workflow.productivity.general'::ltree
    WHEN category = 'writing' THEN 'skills.communication.writing'::ltree
    WHEN category = 'analysis' THEN 'skills.analysis.general'::ltree
    WHEN category = 'creative' THEN 'creative.general'::ltree
    WHEN category = 'business' THEN 'business.general'::ltree
    WHEN category = 'education' THEN 'skills.education.general'::ltree
    ELSE 'general.uncategorized'::ltree
END
WHERE category_path IS NULL;

-- Function to get templates in a category and all subcategories (respects existing RLS)
CREATE OR REPLACE FUNCTION get_category_templates(parent_category text)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    category_path text,
    is_public boolean,
    user_id uuid
) LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
    RETURN QUERY
    SELECT
        pt.id,
        pt.name,
        pt.description,
        pt.category_path::text,
        pt.is_public,
        pt.user_id
    FROM prompt_templates pt
    WHERE pt.category_path <@ parent_category::extensions.ltree
    ORDER BY pt.category_path, pt.name;
END;
$$;

-- Function to get all unique category paths (for building category trees)
CREATE OR REPLACE FUNCTION get_category_tree()
RETURNS TABLE (
    category_path text,
    level integer,
    template_count bigint
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        pt.category_path::text,
        nlevel(pt.category_path) as level,
        COUNT(*) OVER (PARTITION BY pt.category_path) as template_count
    FROM prompt_templates pt
    WHERE
        -- Apply existing RLS policy logic manually in function
        (pt.is_public = true OR (SELECT auth.uid()) = pt.user_id)
        AND pt.category_path IS NOT NULL
    ORDER BY pt.category_path::text;
END;
$$;

-- Function to get parent categories for breadcrumbs
CREATE OR REPLACE FUNCTION get_category_breadcrumbs(child_path text)
RETURNS TABLE (
    path_segment text,
    full_path text,
    depth integer
) LANGUAGE plpgsql AS $$
DECLARE
    path_parts text[];
    i integer;
    current_path text := '';
BEGIN
    -- Split the ltree path into components
    path_parts := string_to_array(child_path, '.');

    FOR i IN 1..array_length(path_parts, 1) LOOP
        current_path := CASE
            WHEN current_path = '' THEN path_parts[i]
            ELSE current_path || '.' || path_parts[i]
        END;

        RETURN QUERY
        SELECT
            path_parts[i] as path_segment,
            current_path as full_path,
            i as depth;
    END LOOP;
END;
$$;

-- =======================
-- 3. Enhanced Search Functions
-- =======================

-- Combined search function that uses both fuzzy and hierarchical search
CREATE OR REPLACE FUNCTION enhanced_prompt_search(
    search_term text DEFAULT NULL,
    category_filter text DEFAULT NULL,
    limit_results integer DEFAULT 20
)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    category_path text,
    search_score float,
    match_type text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        pt.id,
        pt.name,
        pt.description,
        pt.category_path::text,
        CASE
            WHEN search_term IS NOT NULL THEN
                GREATEST(
                    similarity(pt.name, search_term),
                    similarity(coalesce(pt.description, ''), search_term),
                    ts_rank(pt.search_vector, plainto_tsquery('english', search_term))
                )
            ELSE 1.0
        END AS search_score,
        CASE
            WHEN search_term IS NOT NULL AND category_filter IS NOT NULL THEN 'combined'
            WHEN search_term IS NOT NULL THEN 'text_search'
            WHEN category_filter IS NOT NULL THEN 'category_filter'
            ELSE 'browse_all'
        END AS match_type
    FROM prompt_templates pt
    WHERE
        -- Apply existing RLS policy logic manually in function
        (pt.is_public = true OR (SELECT auth.uid()) = pt.user_id)
        AND (
            category_filter IS NULL
            OR pt.category_path <@ category_filter::ltree
        )
        AND (
            search_term IS NULL
            OR similarity(pt.name, search_term) > 0.2
            OR similarity(coalesce(pt.description, ''), search_term) > 0.2
            OR pt.search_vector @@ plainto_tsquery('english', search_term)
        )
    ORDER BY search_score DESC, pt.name
    LIMIT limit_results;
END;
$$;

-- =======================
-- 4. Additional Performance Indexes
-- =======================

-- Additional indexes for common query patterns with existing table
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category_public
ON prompt_templates (category_path, is_public, user_id);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_text_search
ON prompt_templates (name text_pattern_ops, description text_pattern_ops)
WHERE is_public = true;

-- Partial index for user's private templates
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_private
ON prompt_templates (user_id, category_path)
WHERE is_public = false;

-- =======================
-- 5. Grant Permissions
-- =======================

-- Grant execute permissions on search functions to authenticated users
GRANT EXECUTE ON FUNCTION fuzzy_prompt_search(text) TO authenticated;
GRANT EXECUTE ON FUNCTION full_text_prompt_search(text) TO authenticated;
GRANT EXECUTE ON FUNCTION enhanced_prompt_search(text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_category_templates(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_category_tree() TO authenticated;
GRANT EXECUTE ON FUNCTION get_category_breadcrumbs(text) TO authenticated;

-- Grant to anon users for public search (respecting existing RLS)
GRANT EXECUTE ON FUNCTION enhanced_prompt_search(text, text, integer) TO anon;
GRANT EXECUTE ON FUNCTION get_category_tree() TO anon;
GRANT EXECUTE ON FUNCTION get_category_breadcrumbs(text) TO anon;

-- =======================
-- Status Report
-- =======================

SELECT
    'Advanced Search Features Migration Complete for AI Hub' AS status,
    'Extensions: pg_trgm, ltree added to existing prompt_templates' AS extensions,
    'Functions: 6 search functions created with RLS compliance' AS functions,
    'Indexes: 6 performance indexes created' AS indexes,
    'RLS: Fully integrated with existing AI Hub policies' AS security;