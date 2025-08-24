/**
 * MCP AUTODISCOVERY SERVER
 * Automatically discovers and indexes AI content, models, workflows, agents, hackathons, and research
 */

import { supabase } from './supabase'

export interface AutoDiscoveryConfig {
  sources: {
    arxiv?: boolean
    huggingface?: boolean
    github?: boolean
    devpost?: boolean
    paperswithcode?: boolean
    mlnews?: boolean
  }
  intervals: {
    papers: number    // minutes
    models: number    // minutes
    hackathons: number // hours
    news: number      // minutes
  }
  filters: {
    topics: string[]
    minStars?: number
    languages?: string[]
  }
}

export class MCPAutodiscoveryServer {
  private config: AutoDiscoveryConfig
  private running = false
  private intervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(config: AutoDiscoveryConfig) {
    this.config = config
  }

  async start() {
    if (this.running) return
    this.running = true

    console.log('🚀 Starting MCP Autodiscovery Server...')

    // Start all discovery processes
    if (this.config.sources.arxiv) {
      this.startArxivDiscovery()
    }
    if (this.config.sources.huggingface) {
      this.startHuggingFaceDiscovery()
    }
    if (this.config.sources.github) {
      this.startGitHubDiscovery()
    }
    if (this.config.sources.devpost) {
      this.startHackathonDiscovery()
    }
    if (this.config.sources.paperswithcode) {
      this.startPapersWithCodeDiscovery()
    }
    if (this.config.sources.mlnews) {
      this.startMLNewsDiscovery()
    }

    console.log('✅ MCP Autodiscovery Server started')
  }

  async stop() {
    this.running = false
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()
    console.log('🛑 MCP Autodiscovery Server stopped')
  }

  private startArxivDiscovery() {
    const discoverPapers = async () => {
      try {
        console.log('📚 Discovering new papers from arXiv...')
        const topics = this.config.filters.topics.join(' OR ')
        
        // arXiv API query
        const response = await fetch(
          `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(topics)}&sortBy=submittedDate&sortOrder=descending&max_results=50`
        )
        const xml = await response.text()
        
        // Parse XML (simplified - would use proper XML parser in production)
        const papers = this.parseArxivXML(xml)
        
        // Store in database
        for (const paper of papers) {
          await this.storePaper(paper)
        }
        
        console.log(`✅ Discovered ${papers.length} new papers`)
      } catch (error) {
        console.error('❌ Error discovering papers:', error)
      }
    }

    // Run immediately then on interval
    discoverPapers()
    const interval = setInterval(discoverPapers, this.config.intervals.papers * 60 * 1000)
    this.intervals.set('arxiv', interval)
  }

  private startHuggingFaceDiscovery() {
    const discoverModels = async () => {
      try {
        console.log('🤖 Discovering new models from Hugging Face...')
        
        const response = await fetch(
          `https://huggingface.co/api/models?sort=createdAt&direction=-1&limit=50&filter=${encodeURIComponent(this.config.filters.topics.join(','))}`
        )
        const models = await response.json()
        
        for (const model of models) {
          await this.storeModel(model)
        }
        
        console.log(`✅ Discovered ${models.length} new models`)
      } catch (error) {
        console.error('❌ Error discovering models:', error)
      }
    }

    discoverModels()
    const interval = setInterval(discoverModels, this.config.intervals.models * 60 * 1000)
    this.intervals.set('huggingface', interval)
  }

  private startGitHubDiscovery() {
    const discoverRepos = async () => {
      try {
        console.log('🔧 Discovering new GitHub repositories...')
        
        const topics = this.config.filters.topics.join(' ')
        const response = await fetch(
          `https://api.github.com/search/repositories?q=${encodeURIComponent(topics)}&sort=created&order=desc&per_page=50`
        )
        const data = await response.json()
        
        for (const repo of data.items || []) {
          if ((repo.stargazers_count || 0) >= (this.config.filters.minStars || 0)) {
            await this.storeRepository(repo)
          }
        }
        
        console.log(`✅ Discovered ${data.items?.length || 0} new repositories`)
      } catch (error) {
        console.error('❌ Error discovering repositories:', error)
      }
    }

    discoverRepos()
    const interval = setInterval(discoverRepos, this.config.intervals.papers * 60 * 1000)
    this.intervals.set('github', interval)
  }

  private startHackathonDiscovery() {
    const discoverHackathons = async () => {
      try {
        console.log('🏆 Discovering new hackathons...')
        
        // Devpost API (simplified)
        const response = await fetch('https://devpost.com/api/hackathons?status=upcoming&per_page=50')
        const data = await response.json()
        
        for (const hackathon of data.hackathons || []) {
          await this.storeHackathon(hackathon)
        }
        
        console.log(`✅ Discovered ${data.hackathons?.length || 0} new hackathons`)
      } catch (error) {
        console.error('❌ Error discovering hackathons:', error)
      }
    }

    discoverHackathons()
    const interval = setInterval(discoverHackathons, this.config.intervals.hackathons * 60 * 60 * 1000)
    this.intervals.set('hackathons', interval)
  }

  private startPapersWithCodeDiscovery() {
    const discoverTrends = async () => {
      try {
        console.log('📊 Discovering trending papers and code...')
        
        const response = await fetch('https://paperswithcode.com/api/v1/papers/?trending=true')
        const data = await response.json()
        
        for (const paper of data.results || []) {
          await this.storePaperWithCode(paper)
        }
        
        console.log(`✅ Discovered ${data.results?.length || 0} trending papers`)
      } catch (error) {
        console.error('❌ Error discovering Papers with Code:', error)
      }
    }

    discoverTrends()
    const interval = setInterval(discoverTrends, this.config.intervals.papers * 60 * 1000)
    this.intervals.set('paperswithcode', interval)
  }

  private startMLNewsDiscovery() {
    const discoverNews = async () => {
      try {
        console.log('📰 Discovering ML/AI news...')
        
        // Multiple news sources
        const sources = [
          'https://feeds.feedburner.com/oreilly/radar/atom10.xml',
          'https://machinelearningmastery.com/feed/',
          'https://towardsdatascience.com/feed'
        ]
        
        for (const source of sources) {
          try {
            const response = await fetch(source)
            const xml = await response.text()
            const articles = this.parseRSSXML(xml)
            
            for (const article of articles) {
              await this.storeNewsArticle(article)
            }
          } catch (sourceError) {
            console.error(`❌ Error processing source ${source}:`, sourceError)
          }
        }
        
        console.log('✅ News discovery completed')
      } catch (error) {
        console.error('❌ Error discovering news:', error)
      }
    }

    discoverNews()
    const interval = setInterval(discoverNews, this.config.intervals.news * 60 * 1000)
    this.intervals.set('news', interval)
  }

  // Database storage methods
  private async storePaper(paper: any) {
    const { error } = await supabase.from('ai_content').upsert({
      id: `arxiv_${paper.id}`,
      title: paper.title,
      content: paper.abstract,
      summary: paper.abstract.substring(0, 500),
      url: paper.link,
      source: 'arXiv',
      content_type: 'paper',
      authors: paper.authors,
      published_at: paper.published,
      relevance_score: this.calculateRelevance(paper)
    }, { onConflict: 'id' })

    if (error) console.error('Error storing paper:', error)
  }

  private async storeModel(model: any) {
    const { error } = await supabase.from('ai_models').upsert({
      id: `hf_${model.id}`,
      name: model.id,
      description: model.description,
      url: `https://huggingface.co/${model.id}`,
      provider: 'Hugging Face',
      model_type: model.pipeline_tag || 'unknown',
      tags: model.tags || [],
      downloads: model.downloads || 0,
      likes: model.likes || 0,
      created_at: model.createdAt
    }, { onConflict: 'id' })

    if (error) console.error('Error storing model:', error)
  }

  private async storeRepository(repo: any) {
    const { error } = await supabase.from('repositories').upsert({
      id: `gh_${repo.id}`,
      name: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      topics: repo.topics || [],
      created_at: repo.created_at,
      updated_at: repo.updated_at
    }, { onConflict: 'id' })

    if (error) console.error('Error storing repository:', error)
  }

  private async storeHackathon(hackathon: any) {
    const { error } = await supabase.from('hackathons').upsert({
      id: `devpost_${hackathon.id}`,
      name: hackathon.title,
      description: hackathon.description,
      url: hackathon.url,
      platform: 'Devpost',
      start_date: hackathon.submission_period_dates,
      prize_amount: hackathon.prize_amount,
      location: hackathon.location,
      is_virtual: hackathon.open_to === 'public',
      tags: hackathon.themes || []
    }, { onConflict: 'id' })

    if (error) console.error('Error storing hackathon:', error)
  }

  private async storePaperWithCode(paper: any) {
    const { error } = await supabase.from('ai_content').upsert({
      id: `pwc_${paper.id}`,
      title: paper.title,
      content: paper.abstract,
      url: paper.url_pdf,
      source: 'Papers with Code',
      content_type: 'paper',
      authors: paper.authors?.map((a: any) => a.name) || [],
      published_at: paper.published,
      relevance_score: paper.stars || 0
    }, { onConflict: 'id' })

    if (error) console.error('Error storing paper with code:', error)
  }

  private async storeNewsArticle(article: any) {
    const { error } = await supabase.from('ai_content').upsert({
      id: `news_${article.id}`,
      title: article.title,
      content: article.content,
      summary: article.summary,
      url: article.link,
      source: article.source,
      content_type: 'news',
      authors: [article.author],
      published_at: article.published,
      relevance_score: this.calculateRelevance(article)
    }, { onConflict: 'id' })

    if (error) console.error('Error storing news article:', error)
  }

  // Utility methods
  private parseArxivXML(xml: string): any[] {
    // Simplified XML parsing - would use proper parser in production
    const papers: any[] = []
    // Implementation would parse arXiv XML format
    return papers
  }

  private parseRSSXML(xml: string): any[] {
    // Simplified RSS parsing - would use proper parser in production
    const articles: any[] = []
    // Implementation would parse RSS/Atom feeds
    return articles
  }

  private calculateRelevance(item: any): number {
    // Calculate relevance score based on various factors
    let score = 0
    
    // Keywords in title/content
    const keywords = this.config.filters.topics
    const text = `${item.title} ${item.abstract || item.content || ''}`.toLowerCase()
    
    keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        score += 10
      }
    })
    
    // Recency bonus
    if (item.published) {
      const daysOld = (Date.now() - new Date(item.published).getTime()) / (1000 * 60 * 60 * 24)
      if (daysOld < 7) score += 20
      else if (daysOld < 30) score += 10
    }
    
    return Math.min(score, 100)
  }

  // Public API methods
  async getDiscoveredContent(type: string, limit = 50) {
    const { data, error } = await supabase
      .from('ai_content')
      .select('*')
      .eq('content_type', type)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  async searchContent(query: string, type?: string) {
    let queryBuilder = supabase
      .from('ai_content')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('relevance_score', { ascending: false })

    if (type) {
      queryBuilder = queryBuilder.eq('content_type', type)
    }

    const { data, error } = await queryBuilder
    if (error) throw error
    return data
  }
}

// Default configuration
export const defaultAutodiscoveryConfig: AutoDiscoveryConfig = {
  sources: {
    arxiv: true,
    huggingface: true,
    github: true,
    devpost: true,
    paperswithcode: true,
    mlnews: true
  },
  intervals: {
    papers: 30,      // 30 minutes
    models: 60,      // 1 hour
    hackathons: 12,  // 12 hours
    news: 15         // 15 minutes
  },
  filters: {
    topics: [
      'artificial intelligence',
      'machine learning',
      'deep learning',
      'neural networks',
      'computer vision',
      'natural language processing',
      'reinforcement learning',
      'transformers',
      'llm',
      'gpt',
      'claude',
      'anthropic'
    ],
    minStars: 10,
    languages: ['Python', 'JavaScript', 'TypeScript', 'Julia', 'R']
  }
}