import { supabase } from './supabase'

export interface SemanticSearchOptions {
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

export interface SearchResult {
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

export interface SearchResponse {
  success: boolean
  results?: SearchResult[]
  totalCount?: number
  searchType?: string
  query?: string
  processingTimeMs?: number
  error?: string
}

export class SemanticSearchService {
  private static instance: SemanticSearchService
  private baseUrl: string

  constructor() {
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  }

  static getInstance(): SemanticSearchService {
    if (!SemanticSearchService.instance) {
      SemanticSearchService.instance = new SemanticSearchService()
    }
    return SemanticSearchService.instance
  }

  private async makeRequest(endpoint: string, options: any = {}): Promise<any> {
    const { data: { session } } = await supabase.auth.getSession()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: options.method || 'POST',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return await response.json()
  }

  async search(options: SemanticSearchOptions): Promise<SearchResponse> {
    return await this.makeRequest('semantic-search', {
      body: options
    })
  }

  async generateEmbedding(
    contentId: string, 
    contentType: 'ai_content' | 'knowledge_items' | 'hackathons',
    title: string,
    content?: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    return await this.makeRequest('generate-embeddings', {
      body: {
        contentId,
        contentType,
        title,
        content,
        metadata
      }
    })
  }

  async batchEmbedExistingContent(
    contentType: 'ai_content' | 'knowledge_items' | 'all' = 'all',
    options: {
      batchSize?: number
      skipExisting?: boolean
    } = {}
  ): Promise<any> {
    return await this.makeRequest('batch-embed-content', {
      body: {
        contentType,
        ...options
      }
    })
  }

  async getEmbeddingStats(): Promise<any> {
    return await this.makeRequest('batch-embed-content', {
      method: 'GET'
    })
  }

  async healthCheck(): Promise<any> {
    return await this.makeRequest('semantic-search', {
      method: 'GET'
    })
  }

  // Utility method to search with fallback to traditional search
  async searchWithFallback(
    query: string,
    options: Partial<SemanticSearchOptions> = {}
  ): Promise<SearchResult[]> {
    try {
      // Try semantic/hybrid search first
      const searchOptions: SemanticSearchOptions = {
        query,
        searchType: 'hybrid', // Best of both worlds
        threshold: 0.7,
        limit: 20,
        ...options
      }

      const response = await this.search(searchOptions)
      
      if (response.success && response.results) {
        return response.results
      }
      
      throw new Error(response.error || 'Search failed')
      
    } catch (error) {
      console.warn('Semantic search failed, falling back to traditional search:', error)
      
      // Fallback to traditional database search
      return await this.traditionalSearch(query, options)
    }
  }

  private async traditionalSearch(
    query: string,
    options: Partial<SemanticSearchOptions> = {}
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    
    // Search AI content
    if (!options.contentTypes || options.contentTypes.includes('ai_content')) {
      const { data: aiContent } = await supabase
        .from('ai_content')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,summary.ilike.%${query}%`)
        .limit(options.limit || 20)

      if (aiContent) {
        results.push(...aiContent.map(item => ({
          id: item.id,
          contentId: item.id,
          contentType: 'ai_content',
          title: item.title,
          content: item.content,
          metadata: {
            authors: item.authors || [],
            source: item.source,
            content_type: item.content_type
          },
          createdAt: item.created_at,
          url: item.url,
          authors: item.authors,
          source: item.source
        })))
      }
    }

    // Search knowledge items
    if (!options.contentTypes || options.contentTypes.includes('knowledge_items')) {
      const { data: knowledgeItems } = await supabase
        .from('knowledge_items')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(options.limit || 20)

      if (knowledgeItems) {
        results.push(...knowledgeItems.map(item => ({
          id: item.id,
          contentId: item.id,
          contentType: 'knowledge_items',
          title: item.title,
          content: item.content,
          metadata: {
            tags: item.tags || [],
            item_type: item.item_type
          },
          createdAt: item.created_at,
          url: item.source_url,
          tags: item.tags
        })))
      }
    }

    return results.slice(0, options.limit || 20)
  }
}

// Export singleton instance
export const semanticSearch = SemanticSearchService.getInstance()

// Utility functions
export function formatSearchResult(result: SearchResult) {
  return {
    ...result,
    score: result.combinedScore || result.similarity || result.keywordRank || 0,
    displayScore: result.combinedScore 
      ? `${(result.combinedScore * 100).toFixed(1)}% match`
      : result.similarity 
      ? `${(result.similarity * 100).toFixed(1)}% similar`
      : undefined
  }
}

export function groupResultsByType(results: SearchResult[]) {
  return results.reduce((acc, result) => {
    const type = result.contentType
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)
}

export function filterResultsByRelevance(results: SearchResult[], minScore: number = 0.7) {
  return results.filter(result => {
    const score = result.combinedScore || result.similarity || 0
    return score >= minScore
  })
}

// Auto-embedding hook for new content
export async function autoGenerateEmbedding(
  contentId: string,
  contentType: 'ai_content' | 'knowledge_items',
  title: string,
  content?: string,
  metadata?: Record<string, any>
) {
  try {
    await semanticSearch.generateEmbedding(contentId, contentType, title, content, metadata)
    console.log(`Successfully generated embedding for ${contentType} ${contentId}`)
  } catch (error) {
    console.warn(`Failed to generate embedding for ${contentType} ${contentId}:`, error)
    // Don't throw - embedding generation is optional
  }
}