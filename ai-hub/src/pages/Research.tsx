import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { AIContent } from '@/lib/supabase'
import { 
  semanticSearch, 
  type SearchResult, 
  type SemanticSearchOptions,
  formatSearchResult,
  groupResultsByType,
  autoGenerateEmbedding
} from '@/lib/semantic-search'
import { 
  Search, 
  Filter, 
  BookOpen, 
  Newspaper, 
  ExternalLink, 
  Star,
  Calendar,
  User,
  Tag,
  TrendingUp,
  Eye,
  EyeOff,
  Brain,
  Check,
  Sparkles,
  Zap,
  Database,
  Settings,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

type ContentFilter = 'all' | 'paper' | 'news' | 'blog' | 'tutorial'
type SortOption = 'latest' | 'relevance' | 'alphabetical'
type SearchMode = 'traditional' | 'semantic' | 'hybrid'

export function Research() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<AIContent[]>([])
  const [filteredContent, setFilteredContent] = useState<AIContent[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<ContentFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [searchMode, setSearchMode] = useState<SearchMode>('semantic')
  const [sources, setSources] = useState<string[]>([])
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [explanations, setExplanations] = useState<Record<string, string>>({})
  const [loadingExplanations, setLoadingExplanations] = useState<Record<string, boolean>>({})
  const [isSearching, setIsSearching] = useState(false)
  const [isSemanticSearchEnabled, setIsSemanticSearchEnabled] = useState(false)
  const [embeddingStats, setEmbeddingStats] = useState<any>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [lastSearchTime, setLastSearchTime] = useState<number>(0)

  const filters = [
    { id: 'all', label: 'All Content', icon: TrendingUp },
    { id: 'paper', label: 'Research Papers', icon: BookOpen },
    { id: 'news', label: 'News Articles', icon: Newspaper },
    { id: 'blog', label: 'Blog Posts', icon: User },
    { id: 'tutorial', label: 'Tutorials', icon: Tag },
  ] as const

  const sortOptions = [
    { id: 'latest', label: 'Latest First' },
    { id: 'relevance', label: 'Most Relevant' },
    { id: 'alphabetical', label: 'Alphabetical' },
  ] as const

  useEffect(() => {
    fetchContent()
    checkSemanticSearchAvailability()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() && isSemanticSearchEnabled && searchMode !== 'traditional') {
      performSemanticSearch()
    } else {
      filterAndSortContent()
    }
  }, [content, searchQuery, activeFilter, sortBy, selectedSources, searchMode])

  useEffect(() => {
    if (isSemanticSearchEnabled) {
      fetchEmbeddingStats()
    }
  }, [isSemanticSearchEnabled])

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_content')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setContent(data || [])
      
      // Extract unique sources
      const uniqueSources = [...new Set((data || []).map(item => item.source).filter(Boolean))] as string[]
      setSources(uniqueSources)
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkSemanticSearchAvailability = async () => {
    try {
      const healthCheck = await semanticSearch.healthCheck()
      setIsSemanticSearchEnabled(healthCheck.success && healthCheck.hasOpenAIKey)
    } catch (error) {
      console.warn('Semantic search not available:', error)
      setIsSemanticSearchEnabled(false)
    }
  }

  const fetchEmbeddingStats = async () => {
    try {
      const stats = await semanticSearch.getEmbeddingStats()
      setEmbeddingStats(stats)
    } catch (error) {
      console.error('Error fetching embedding stats:', error)
    }
  }

  const performSemanticSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const startTime = Date.now()

    try {
      const contentTypesMap: Record<ContentFilter, string[]> = {
        all: ['ai_content', 'knowledge_items'],
        paper: ['ai_content'],
        news: ['ai_content'],
        blog: ['ai_content'],
        tutorial: ['ai_content'],
      }

      const searchOptions: SemanticSearchOptions = {
        query: searchQuery,
        searchType: searchMode === 'semantic' ? 'semantic' : 'hybrid',
        contentTypes: contentTypesMap[activeFilter] as any,
        threshold: 0.7,
        limit: 50,
        filters: selectedSources.length > 0 ? { sources: selectedSources } : undefined
      }

      const response = await semanticSearch.search(searchOptions)
      
      if (response.success && response.results) {
        setSearchResults(response.results)
        setLastSearchTime(response.processingTimeMs || Date.now() - startTime)
      } else {
        throw new Error(response.error || 'Search failed')
      }
    } catch (error) {
      console.error('Semantic search error:', error)
      // Fallback to traditional search
      try {
        const fallbackResults = await semanticSearch.searchWithFallback(searchQuery, {
          contentTypes: activeFilter === 'all' ? undefined : ['ai_content'],
          limit: 50
        })
        setSearchResults(fallbackResults)
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError)
        setSearchResults([])
      }
    } finally {
      setIsSearching(false)
    }
  }

  const generateMissingEmbeddings = async () => {
    try {
      setLoading(true)
      await semanticSearch.batchEmbedExistingContent('all', { 
        batchSize: 20, 
        skipExisting: true 
      })
      await fetchEmbeddingStats()
    } catch (error) {
      console.error('Error generating embeddings:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortContent = () => {
    // Reset search results when doing traditional filtering
    if (searchResults.length > 0 && (!searchQuery.trim() || searchMode === 'traditional')) {
      setSearchResults([])
    }

    let filtered = [...content]

    // Apply content type filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(item => item.content_type === activeFilter)
    }

    // Apply source filter
    if (selectedSources.length > 0) {
      filtered = filtered.filter(item => selectedSources.includes(item.source))
    }

    // Apply search filter
    if (searchQuery.trim() && searchMode === 'traditional') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.content?.toLowerCase().includes(query) ||
        item.summary?.toLowerCase().includes(query) ||
        item.authors.some(author => author.toLowerCase().includes(query))
      )
    }

    // Apply sorting
    switch (sortBy) {
      case 'latest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'relevance':
        filtered.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
        break
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
    }

    setFilteredContent(filtered)
  }

  const renderSearchResults = () => {
    if (!searchQuery.trim() || searchMode === 'traditional') {
      return renderTraditionalContent()
    }

    if (searchResults.length === 0) {
      return (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            No results found
          </h3>
          <p className="text-gray-400">
            Try adjusting your search terms or using traditional search
          </p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {searchResults.map((result) => {
          const formattedResult = formatSearchResult(result)
          const hasExplanation = explanations[result.contentId]
          const isLoadingExplanation = loadingExplanations[result.contentId]
          
          return (
            <div
              key={result.id}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:bg-gray-800/50 transition-colors"
            >
              {/* Header with score */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-400" />
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-900/50 text-blue-300">
                    {result.contentType.replace('_', ' ')}
                  </span>
                  {formattedResult.displayScore && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-900/50 text-green-300">
                      {formattedResult.displayScore}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleReadStatus(result.contentId, false)}
                    className="text-gray-400 hover:text-green-400 transition-colors"
                    title="Mark as read"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-gray-400 hover:text-yellow-400 transition-colors">
                    <Star className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-white font-semibold mb-3 line-clamp-2">
                {result.title}
              </h3>

              {/* Content preview */}
              <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                {result.content}
              </p>

              {/* Authors */}
              {result.authors && result.authors.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">
                    {result.authors.slice(0, 2).join(', ')}
                    {result.authors.length > 2 && ` +${result.authors.length - 2} more`}
                  </span>
                </div>
              )}

              {/* Explanation */}
              {hasExplanation && (
                <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium text-blue-300">AI Explanation</span>
                  </div>
                  <p className="text-xs text-gray-300">{explanations[result.contentId]}</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {result.source && (
                    <span className="px-2 py-1 bg-gray-800 rounded-full">
                      {result.source}
                    </span>
                  )}
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(result.createdAt)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => explainPaper(result.contentId, result.title, result.content)}
                    disabled={isLoadingExplanation}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isLoadingExplanation ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Explaining...
                      </>
                    ) : hasExplanation ? (
                      <>
                        <Check className="w-3 h-3" />
                        Explained
                      </>
                    ) : (
                      <>
                        <Brain className="w-3 h-3" />
                        Explain
                      </>
                    )}
                  </button>
                  
                  {result.url && (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      Read
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderTraditionalContent = () => {
    const contentToRender = searchQuery.trim() && searchMode === 'traditional' ? filteredContent : 
                           searchQuery.trim() ? [] : filteredContent
                           
    if (contentToRender.length === 0) {
      return (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            No content found
          </h3>
          <p className="text-gray-400">
            Try adjusting your search terms or filters
          </p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {contentToRender.map((item) => {
          const Icon = getContentTypeIcon(item.content_type)
          const hasExplanation = explanations[item.id]
          const isLoadingExplanation = loadingExplanations[item.id]
          
          return (
            <div
              key={item.id}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:bg-gray-800/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className={`text-xs px-2 py-1 rounded-full ${getContentTypeColor(item.content_type)}`}>
                    {item.content_type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleReadStatus(item.id, item.is_read)}
                    className={`text-gray-400 hover:text-green-400 transition-colors ${item.is_read ? 'text-green-400' : ''}`}
                    title={item.is_read ? "Mark as unread" : "Mark as read"}
                  >
                    {item.is_read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button className="text-gray-400 hover:text-yellow-400 transition-colors">
                    <Star className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-white font-semibold mb-3 line-clamp-2">
                {item.title}
              </h3>

              {/* Summary */}
              <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                {item.summary || item.content}
              </p>

              {/* Authors */}
              {item.authors.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">
                    {item.authors.slice(0, 2).join(', ')}
                    {item.authors.length > 2 && ` +${item.authors.length - 2} more`}
                  </span>
                </div>
              )}

              {/* Explanation */}
              {hasExplanation && (
                <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium text-blue-300">AI Explanation</span>
                  </div>
                  <p className="text-xs text-gray-300">{explanations[item.id]}</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="px-2 py-1 bg-gray-800 rounded-full">
                    {item.source}
                  </span>
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(item.published_at || item.created_at)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => explainPaper(item.id, item.title, item.content)}
                    disabled={isLoadingExplanation}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isLoadingExplanation ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Explaining...
                      </>
                    ) : hasExplanation ? (
                      <>
                        <Check className="w-3 h-3" />
                        Explained
                      </>
                    ) : (
                      <>
                        <Brain className="w-3 h-3" />
                        Explain
                      </>
                    )}
                  </button>
                  
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      Read
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'paper': return 'bg-blue-900/50 text-blue-300'
      case 'news': return 'bg-green-900/50 text-green-300'
      case 'blog': return 'bg-purple-900/50 text-purple-300'
      case 'tutorial': return 'bg-orange-900/50 text-orange-300'
      default: return 'bg-gray-900/50 text-gray-300'
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'paper': return BookOpen
      case 'news': return Newspaper
      case 'blog': return User
      case 'tutorial': return Tag
      default: return BookOpen
    }
  }

  const toggleSourceFilter = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    )
  }

  const toggleReadStatus = async (contentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_content')
        .update({ is_read: !currentStatus })
        .eq('id', contentId)

      if (error) throw error

      // Update local state
      setContent(prev => prev.map(item => 
        item.id === contentId ? { ...item, is_read: !currentStatus } : item
      ))
    } catch (error) {
      console.error('Error updating read status:', error)
    }
  }

  const explainPaper = async (contentId: string, title: string, contentText: string | undefined) => {
    if (!user) return
    
    // Set loading state for this paper
    setLoadingExplanations(prev => ({ ...prev, [contentId]: true }))
    
    try {
      // For now, we'll use a simple summarization approach
      // In a real implementation, this would connect to an AI model
      const prompt = `Please explain the following research paper in simple terms:\n\nTitle: ${title}\n\nContent: ${contentText?.substring(0, 1000) || 'No content available'}`
      
      // Simulate AI processing
      const explanation = `This is a simulated explanation for the paper titled "${title}". In a real implementation, this would connect to an AI model to provide a detailed explanation of the paper's content. The paper discusses important concepts in the field of AI research.`
      
      // Set the explanation in state
      setExplanations(prev => ({ ...prev, [contentId]: explanation }))
    } catch (error) {
      console.error('Error explaining paper:', error)
      setExplanations(prev => ({ ...prev, [contentId]: 'Failed to generate explanation. Please try again.' }))
    } finally {
      // Remove loading state
      setLoadingExplanations(prev => ({ ...prev, [contentId]: false }))
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Research Hub</h1>
          <p className="text-gray-400">
            Explore the latest AI research, papers, and industry insights
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Enhanced Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={isSemanticSearchEnabled 
                ? "Ask anything... 'What are the latest trends in neural networks?'" 
                : "Search papers, articles, authors..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-11 pr-20 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {isSearching && <LoadingSpinner size="sm" />}
              {isSemanticSearchEnabled && (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                  title="Search settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search Mode & Settings */}
          {isSemanticSearchEnabled && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">AI Search</span>
                  </div>
                  
                  {/* Search Mode Toggle */}
                  <div className="flex bg-gray-700 rounded-lg p-1">
                    {[
                      { id: 'semantic', label: 'Semantic', icon: Brain },
                      { id: 'hybrid', label: 'Hybrid', icon: Zap },
                      { id: 'traditional', label: 'Keyword', icon: Search }
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setSearchMode(id as SearchMode)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          searchMode === id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:text-white hover:bg-gray-600'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  {searchResults.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span>{searchResults.length} results</span>
                      {lastSearchTime > 0 && (
                        <span>• {lastSearchTime}ms</span>
                      )}
                    </div>
                  )}
                  
                  {embeddingStats && (
                    <div className="flex items-center gap-2">
                      <Database className="w-3 h-3" />
                      <span>{embeddingStats.statistics?.totalEmbeddings || 0} embeddings</span>
                    </div>
                  )}
                  
                  <button
                    onClick={generateMissingEmbeddings}
                    disabled={loading}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Sync
                  </button>
                </div>
              </div>

              {/* Search Mode Info */}
              <div className="mt-3 text-xs text-gray-400">
                {searchMode === 'semantic' && (
                  <p><Brain className="w-3 h-3 inline mr-1" />Semantic search finds content by meaning, not just keywords</p>
                )}
                {searchMode === 'hybrid' && (
                  <p><Zap className="w-3 h-3 inline mr-1" />Hybrid combines semantic understanding with keyword matching</p>
                )}
                {searchMode === 'traditional' && (
                  <p><Search className="w-3 h-3 inline mr-1" />Keyword search matches exact terms in titles and content</p>
                )}
              </div>
            </div>
          )}

          {/* No Vector Search Warning */}
          {!isSemanticSearchEnabled && (
            <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-300 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Enhanced search unavailable</span>
              </div>
              <p className="text-sm text-orange-200/80">
                Semantic and AI-powered search features require OpenAI API configuration. 
                Currently using traditional keyword search only.
              </p>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Content Type Filters */}
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => {
                const Icon = filter.icon
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeFilter === filter.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {filter.label}
                  </button>
                )
              })}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Source Filters */}
          {sources.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-400 py-2">Sources:</span>
              {sources.map((source) => (
                <button
                  key={source}
                  onClick={() => toggleSourceFilter(source)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedSources.includes(source)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-gray-400">
              {searchResults.length > 0 ? (
                <>
                  {searchResults.length} semantic result{searchResults.length !== 1 ? 's' : ''}
                  {searchQuery && ` for "${searchQuery}"`}
                </>
              ) : (
                <>
                  {filteredContent.length} result{filteredContent.length !== 1 ? 's' : ''}
                  {searchQuery && searchMode === 'traditional' && ` for "${searchQuery}"`}
                </>
              )}
            </p>
            
            {searchResults.length > 0 && searchMode !== 'traditional' && (
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  searchMode === 'semantic' ? 'bg-blue-400' : 'bg-purple-400'
                }`}></div>
                <span className="text-gray-400 capitalize">{searchMode} search</span>
              </div>
            )}
          </div>
          
          {embeddingStats && isSemanticSearchEnabled && (
            <div className="text-xs text-gray-500">
              Vector coverage: AI Content {embeddingStats.statistics?.coverage?.ai_content || '0%'} | 
              Knowledge {embeddingStats.statistics?.coverage?.knowledge_items || '0%'}
            </div>
          )}
        </div>

        {/* Enhanced Content Display */}
        {renderSearchResults()}
      </div>
    </Layout>
  )
}