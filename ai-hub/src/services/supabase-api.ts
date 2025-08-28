/**
 * Supabase Edge Functions API Client
 * Connects to your actual edge functions for real functionality
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Make sure we have the key
if (!SUPABASE_ANON_KEY) {
  console.warn('VITE_SUPABASE_ANON_KEY not found in environment variables')
}

interface EdgeFunctionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export class SupabaseAPI {
  private static async callEdgeFunction<T = any>(
    functionName: string, 
    body?: any
  ): Promise<EdgeFunctionResponse<T>> {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error(`Edge function ${functionName} failed:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Fetch latest hackathons from multiple sources (Google, DevPost, etc.)
   */
  static async fetchHackathons(options: {
    sources?: string[]
    limit?: number
    keywords?: string[]
  } = {}) {
    return this.callEdgeFunction('fetch-hackathons', {
      sources: options.sources || ['devpost', 'hackerearth', 'mlh'],
      limit: options.limit || 100,
      keywords: options.keywords || []
    })
  }

  /**
   * Simple hackathon fetch (existing function)
   */
  static async fetchHackathonsSimple() {
    return this.callEdgeFunction('fetch-hackathons-simple')
  }

  /**
   * Fetch AI-related stock data
   */
  static async fetchStockData(symbols?: string[]) {
    return this.callEdgeFunction('fetch-stock-data', {
      symbols: symbols || ['NVDA', 'GOOGL', 'MSFT', 'AMD', 'TSLA']
    })
  }

  /**
   * Aggregate AI content from multiple sources
   */
  static async aggregateAIContent(options: {
    sources?: string[]
    topics?: string[]
    limit?: number
  } = {}) {
    return this.callEdgeFunction('aggregate-ai-content', {
      sources: options.sources || ['arxiv', 'techcrunch', 'venturebeat'],
      topics: options.topics || ['artificial intelligence', 'machine learning'],
      limit: options.limit || 50
    })
  }

  /**
   * Generate daily newsletter
   */
  static async generateDailyNewsletter(userId: string) {
    return this.callEdgeFunction('generate-daily-newsletter', {
      user_id: userId
    })
  }

  /**
   * Generate weekly newsletter
   */
  static async generateWeeklyNewsletter(userId: string) {
    return this.callEdgeFunction('generate-weekly-newsletter', {
      user_id: userId
    })
  }

  /**
   * Fetch startup funding data
   */
  static async fetchStartupFunding(options: {
    sectors?: string[]
    funding_stages?: string[]
    limit?: number
  } = {}) {
    return this.callEdgeFunction('fetch-startup-funding', {
      sectors: options.sectors || ['ai', 'machine learning', 'automation'],
      funding_stages: options.funding_stages || ['Series A', 'Series B', 'Seed'],
      limit: options.limit || 50
    })
  }

  /**
   * Fetch job market data
   */
  static async fetchJobMarket(options: {
    roles?: string[]
    locations?: string[]
    experience_levels?: string[]
    limit?: number
  } = {}) {
    return this.callEdgeFunction('fetch-job-market', {
      roles: options.roles || ['AI Engineer', 'Machine Learning Engineer', 'Data Scientist'],
      locations: options.locations || ['Remote', 'San Francisco', 'New York'],
      experience_levels: options.experience_levels || ['Mid', 'Senior'],
      limit: options.limit || 100
    })
  }

  /**
   * MCP-powered hackathon search with RAG
   */
  static async searchHackathonsWithRAG(query: string, options: {
    semantic_search?: boolean
    include_descriptions?: boolean
    filter_by_date?: boolean
    max_results?: number
  } = {}) {
    return this.callEdgeFunction('fetch-hackathons', {
      query,
      semantic_search: options.semantic_search ?? true,
      include_descriptions: options.include_descriptions ?? true,
      filter_by_date: options.filter_by_date ?? true,
      max_results: options.max_results || 20,
      use_rag: true
    })
  }
}

/**
 * Real-time hackathon search with MCP integration
 */
export class HackathonSearchService {
  private static cache = new Map<string, { data: any; timestamp: number }>()
  private static CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  static async searchHackathons(searchParams: {
    query?: string
    platforms?: string[]
    locations?: string[]
    prize_range?: { min: number; max: number }
    date_filter?: 'upcoming' | 'this_month' | 'next_3_months' | 'all'
    tags?: string[]
    use_rag?: boolean
  }) {
    const cacheKey = JSON.stringify(searchParams)
    const cached = this.cache.get(cacheKey)
    
    // Return cached results if valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    try {
      let results

      if (searchParams.use_rag && searchParams.query) {
        // Use RAG-powered search for complex queries
        results = await SupabaseAPI.searchHackathonsWithRAG(searchParams.query, {
          semantic_search: true,
          include_descriptions: true,
          filter_by_date: searchParams.date_filter !== 'all',
          max_results: 50
        })
      } else {
        // Use standard search
        results = await SupabaseAPI.fetchHackathons({
          sources: this.platformsToSources(searchParams.platforms),
          keywords: searchParams.query ? [searchParams.query] : [],
          limit: 100
        })
      }

      if (results.success) {
        // Apply additional client-side filtering
        const filtered = this.applyFilters(results.data, searchParams)
        
        // Cache the results
        this.cache.set(cacheKey, {
          data: { ...results, data: filtered },
          timestamp: Date.now()
        })
        
        return { ...results, data: filtered }
      }

      return results
    } catch (error) {
      console.error('Hackathon search failed:', error)
      return {
        success: false,
        error: 'Search failed',
        data: []
      }
    }
  }

  private static platformsToSources(platforms?: string[]): string[] {
    if (!platforms || platforms.length === 0) {
      return ['devpost', 'hackerearth', 'mlh', 'angelhack']
    }

    return platforms.map(platform => {
      switch (platform.toLowerCase()) {
        case 'devpost': return 'devpost'
        case 'hackerearth': return 'hackerearth' 
        case 'mlh': return 'mlh'
        case 'angelhack': return 'angelhack'
        case 'hackerrank': return 'hackerrank'
        default: return 'general'
      }
    })
  }

  private static applyFilters(hackathons: any[], filters: any) {
    if (!hackathons || !Array.isArray(hackathons)) return []

    return hackathons.filter(hackathon => {
      // Location filter
      if (filters.locations && filters.locations.length > 0) {
        const matchesVirtual = filters.locations.includes('Virtual') && hackathon.is_virtual
        const matchesLocation = hackathon.location && 
          filters.locations.some((loc: string) => 
            loc !== 'Virtual' && hackathon.location.toLowerCase().includes(loc.toLowerCase())
          )
        if (!matchesVirtual && !matchesLocation) return false
      }

      // Prize range filter
      if (filters.prize_range && hackathon.prize_amount) {
        if (hackathon.prize_amount < filters.prize_range.min || 
            hackathon.prize_amount > filters.prize_range.max) {
          return false
        }
      }

      // Date filter
      if (filters.date_filter && filters.date_filter !== 'all' && hackathon.start_date) {
        const today = new Date()
        const startDate = new Date(hackathon.start_date)
        
        switch (filters.date_filter) {
          case 'upcoming':
            if (startDate < today) return false
            break
          case 'this_month':
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            if (startDate < today || startDate > endOfMonth) return false
            break
          case 'next_3_months':
            const threeMonthsLater = new Date(today.getFullYear(), today.getMonth() + 3, 0)
            if (startDate < today || startDate > threeMonthsLater) return false
            break
        }
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0 && hackathon.tags) {
        const hasMatchingTag = filters.tags.some((tag: string) =>
          hackathon.tags.some((hackathonTag: string) =>
            hackathonTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
        if (!hasMatchingTag) return false
      }

      return true
    })
  }

  /**
   * Clear the search cache
   */
  static clearCache() {
    this.cache.clear()
  }
}

/**
 * Content aggregation service
 */
export class ContentAggregationService {
  static async getLatestAINews() {
    return SupabaseAPI.aggregateAIContent({
      sources: ['techcrunch', 'venturebeat', 'theverge', 'arxiv'],
      topics: ['artificial intelligence', 'machine learning', 'neural networks', 'deep learning'],
      limit: 20
    })
  }

  static async getMarketData() {
    const [stocks, funding, jobs] = await Promise.all([
      SupabaseAPI.fetchStockData(),
      SupabaseAPI.fetchStartupFunding(),
      SupabaseAPI.fetchJobMarket()
    ])

    return {
      stocks: stocks.success ? stocks.data : [],
      funding: funding.success ? funding.data : [],
      jobs: jobs.success ? jobs.data : []
    }
  }
}