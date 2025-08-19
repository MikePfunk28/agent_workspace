import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { AIContent } from '@/lib/supabase'
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
  Check
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

type ContentFilter = 'all' | 'paper' | 'news' | 'blog' | 'tutorial'
type SortOption = 'latest' | 'relevance' | 'alphabetical'

export function Research() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<AIContent[]>([])
  const [filteredContent, setFilteredContent] = useState<AIContent[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<ContentFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [sources, setSources] = useState<string[]>([])
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [explanations, setExplanations] = useState<Record<string, string>>({})
  const [loadingExplanations, setLoadingExplanations] = useState<Record<string, boolean>>({})

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
  }, [])

  useEffect(() => {
    filterAndSortContent()
  }, [content, searchQuery, activeFilter, sortBy, selectedSources])

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

  const filterAndSortContent = () => {
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
    if (searchQuery.trim()) {
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
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search papers, articles, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

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
          <p className="text-gray-400">
            {filteredContent.length} result{filteredContent.length !== 1 ? 's' : ''}
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredContent.map((item) => {
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

        {/* Empty State */}
        {filteredContent.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              No content found
            </h3>
            <p className="text-gray-400">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}