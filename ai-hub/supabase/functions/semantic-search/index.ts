import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface SearchRequest {
  query: string
  searchType?: 'semantic' | 'hybrid' | 'keyword'
  contentTypes?: ('ai_content' | 'knowledge_items' | 'hackathons')[]
  threshold?: number
  limit?: number
  filters?: {
    authors?: string[]
    sources?: string[]
    tags?: string[]
    dateRange?: {
      start?: string
      end?: string
    }
  }
}

interface SearchResult {
  id: string
  contentId: string
  contentType: string
  title: string
  content?: string
  metadata: Record<string, any>
  similarity?: number
  keywordRank?: number
  combinedScore?: number
  createdAt: string
  url?: string
  authors?: string[]
  source?: string
  tags?: string[]
}

interface SearchResponse {
  success: boolean
  results?: SearchResult[]
  totalCount?: number
  searchType?: string
  query?: string
  processingTimeMs?: number
  error?: string
}

async function generateQueryEmbedding(query: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: query,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

async function performSemanticSearch(
  supabase: any,
  queryEmbedding: number[],
  options: SearchRequest
): Promise<SearchResult[]> {
  const {
    threshold = 0.7,
    limit = 20,
    contentTypes,
    filters
  } = options

  const query = supabase.rpc('semantic_search', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    match_threshold: threshold,
    match_count: limit,
    filter_content_type: contentTypes?.length === 1 ? contentTypes[0] : null
  })

  const { data, error } = await query

  if (error) {
    throw new Error(`Semantic search error: ${error.message}`)
  }

  return data.map((row: any) => ({
    id: row.id,
    contentId: row.content_id,
    contentType: row.content_type,
    title: row.title,
    content: row.content_text,
    metadata: row.metadata,
    similarity: row.similarity,
    createdAt: row.created_at,
    url: row.metadata?.url,
    authors: row.metadata?.authors,
    source: row.metadata?.source,
    tags: row.metadata?.tags
  }))
}

async function performHybridSearch(
  supabase: any,
  queryText: string,
  queryEmbedding: number[],
  options: SearchRequest
): Promise<SearchResult[]> {
  const {
    threshold = 0.7,
    limit = 20,
    contentTypes
  } = options

  const { data, error } = await supabase.rpc('hybrid_search', {
    query_text: queryText,
    query_embedding: `[${queryEmbedding.join(',')}]`,
    match_threshold: threshold,
    match_count: limit,
    filter_content_type: contentTypes?.length === 1 ? contentTypes[0] : null
  })

  if (error) {
    throw new Error(`Hybrid search error: ${error.message}`)
  }

  return data.map((row: any) => ({
    id: row.id,
    contentId: row.content_id,
    contentType: row.content_type,
    title: row.title,
    content: row.content_text,
    metadata: row.metadata,
    similarity: row.semantic_similarity,
    keywordRank: row.keyword_rank,
    combinedScore: row.combined_score,
    createdAt: row.created_at,
    url: row.metadata?.url,
    authors: row.metadata?.authors,
    source: row.metadata?.source,
    tags: row.metadata?.tags
  }))
}

async function performKeywordSearch(
  supabase: any,
  queryText: string,
  options: SearchRequest
): Promise<SearchResult[]> {
  const {
    limit = 20,
    contentTypes
  } = options

  let query = supabase
    .from('content_embeddings')
    .select('*')
    .textSearch('title,content_text', queryText, {
      type: 'websearch',
      config: 'english'
    })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (contentTypes && contentTypes.length > 0) {
    query = query.in('content_type', contentTypes)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Keyword search error: ${error.message}`)
  }

  return data.map((row: any) => ({
    id: row.id,
    contentId: row.content_id,
    contentType: row.content_type,
    title: row.title,
    content: row.content_text,
    metadata: row.metadata,
    createdAt: row.created_at,
    url: row.metadata?.url,
    authors: row.metadata?.authors,
    source: row.metadata?.source,
    tags: row.metadata?.tags
  }))
}

function applyFilters(results: SearchResult[], filters?: SearchRequest['filters']): SearchResult[] {
  if (!filters) return results

  return results.filter(result => {
    // Author filter
    if (filters.authors && filters.authors.length > 0) {
      if (!result.authors || !result.authors.some(author => 
        filters.authors!.some(filterAuthor => 
          author.toLowerCase().includes(filterAuthor.toLowerCase())
        )
      )) {
        return false
      }
    }

    // Source filter
    if (filters.sources && filters.sources.length > 0) {
      if (!result.source || !filters.sources.some(source => 
        result.source!.toLowerCase().includes(source.toLowerCase())
      )) {
        return false
      }
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      if (!result.tags || !result.tags.some(tag => 
        filters.tags!.some(filterTag => 
          tag.toLowerCase().includes(filterTag.toLowerCase())
        )
      )) {
        return false
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const resultDate = new Date(result.createdAt)
      if (filters.dateRange.start && resultDate < new Date(filters.dateRange.start)) {
        return false
      }
      if (filters.dateRange.end && resultDate > new Date(filters.dateRange.end)) {
        return false
      }
    }

    return true
  })
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration not found')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    if (req.method === 'GET') {
      // Health check endpoint
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Semantic search service is running',
          hasOpenAIKey: !!OPENAI_API_KEY,
          availableSearchTypes: ['semantic', 'hybrid', 'keyword']
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: SearchRequest = await req.json()
    
    if (!body.query?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const searchType = body.searchType || 'semantic'
    let results: SearchResult[] = []

    switch (searchType) {
      case 'semantic': {
        const queryEmbedding = await generateQueryEmbedding(body.query)
        results = await performSemanticSearch(supabase, queryEmbedding, body)
        break
      }

      case 'hybrid': {
        const queryEmbedding = await generateQueryEmbedding(body.query)
        results = await performHybridSearch(supabase, body.query, queryEmbedding, body)
        break
      }

      case 'keyword': {
        results = await performKeywordSearch(supabase, body.query, body)
        break
      }

      default: {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid search type. Use: semantic, hybrid, or keyword' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Apply additional filters
    const filteredResults = applyFilters(results, body.filters)

    const processingTimeMs = Date.now() - startTime

    const response: SearchResponse = {
      success: true,
      results: filteredResults,
      totalCount: filteredResults.length,
      searchType,
      query: body.query,
      processingTimeMs
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in semantic-search function:', error)
    
    const errorResponse: SearchResponse = {
      success: false,
      error: error.message || 'Internal server error'
    }

    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/*
Usage examples:

1. Basic semantic search:
POST /functions/v1/semantic-search
{
  "query": "neural networks in computer vision",
  "searchType": "semantic",
  "limit": 10
}

2. Hybrid search with filters:
POST /functions/v1/semantic-search
{
  "query": "machine learning algorithms",
  "searchType": "hybrid",
  "contentTypes": ["ai_content"],
  "threshold": 0.75,
  "limit": 20,
  "filters": {
    "authors": ["Geoffrey Hinton"],
    "sources": ["arXiv", "Nature"],
    "dateRange": {
      "start": "2023-01-01",
      "end": "2024-12-31"
    }
  }
}

3. Keyword search:
POST /functions/v1/semantic-search
{
  "query": "transformers attention mechanisms",
  "searchType": "keyword",
  "contentTypes": ["ai_content", "knowledge_items"],
  "limit": 15
}

4. Search across all content types:
POST /functions/v1/semantic-search
{
  "query": "artificial intelligence trends",
  "searchType": "hybrid",
  "threshold": 0.7,
  "limit": 25
}
*/