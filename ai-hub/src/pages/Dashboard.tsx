import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { AIContent, StockData, Hackathon } from '@/lib/supabase'
import Todos from '@/components/Todos'
import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  Calendar,
  Trophy,
  Zap,
  RefreshCw,
  ExternalLink,
  Star
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [aiContent, setAiContent] = useState<AIContent[]>([])
  const [stockData, setStockData] = useState<StockData[]>([])
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      // Fetch latest AI content
      const { data: contentData } = await supabase
        .from('ai_content')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8)

      // Fetch latest stock data (most recent for each symbol)
      const { data: stockResponse } = await supabase
        .from('stock_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20)

      // Fetch upcoming hackathons
      const today = new Date().toISOString().split('T')[0]
      const { data: hackathonData } = await supabase
        .from('hackathons')
        .select('*')
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(5)

      setAiContent(contentData || [])
      setStockData(stockResponse || [])
      setHackathons(hackathonData || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    try {
      // Trigger data collection from edge functions
      await Promise.all([
        supabase.functions.invoke('fetch-stock-data'),
        supabase.functions.invoke('aggregate-ai-content'),
        supabase.functions.invoke('fetch-hackathons')
      ])

      // Refresh dashboard data
      await fetchDashboardData()
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price)
  }

  // Get unique stock symbols (latest data for each)
  const uniqueStocks = stockData.reduce((acc, stock) => {
    if (!acc[stock.symbol] || new Date(stock.timestamp) > new Date(acc[stock.symbol].timestamp)) {
      acc[stock.symbol] = stock
    }
    return acc
  }, {} as Record<string, StockData>)

  const latestStocks = Object.values(uniqueStocks).slice(0, 6)

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
            </h1>
            <p className="text-gray-400">
              Here's what's happening in the AI world today
            </p>
          </div>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Supabase Connection Test */}
        <div className="mb-8">
          <Todos />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300 text-sm font-medium">AI Papers</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {aiContent.filter(c => c.content_type === 'paper').length}
            </div>
            <div className="text-xs text-gray-400 mt-1">Latest research</div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-gray-300 text-sm font-medium">Stock Symbols</span>
            </div>
            <div className="text-2xl font-bold text-white">{latestStocks.length}</div>
            <div className="text-xs text-gray-400 mt-1">AI/Tech companies</div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-300 text-sm font-medium">Hackathons</span>
            </div>
            <div className="text-2xl font-bold text-white">{hackathons.length}</div>
            <div className="text-xs text-gray-400 mt-1">Upcoming events</div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <span className="text-gray-300 text-sm font-medium">News Articles</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {aiContent.filter(c => c.content_type === 'news').length}
            </div>
            <div className="text-xs text-gray-400 mt-1">Industry updates</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI News Feed */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Latest AI Research & News</h2>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-4">
                {aiContent.slice(0, 6).map((content) => (
                  <div key={content.id} className="border-b border-gray-800 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        content.content_type === 'paper' ? 'bg-blue-400' : 'bg-green-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            content.content_type === 'paper'
                              ? 'bg-blue-900/50 text-blue-300'
                              : 'bg-green-900/50 text-green-300'
                          }`}>
                            {content.content_type === 'paper' ? 'Research' : 'News'}
                          </span>
                          <span className="text-xs text-gray-400">{content.source}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-400">
                            {formatDate(content.published_at || content.created_at)}
                          </span>
                        </div>
                        <h3 className="text-white font-medium mb-2 line-clamp-2">
                          {content.title}
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                          {content.summary || content.content}
                        </p>
                        {content.url && (
                          <a
                            href={content.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                          >
                            Read more
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Stock Tracker */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">AI/Tech Stocks</h2>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-3">
                {latestStocks.map((stock) => (
                  <div key={stock.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{stock.symbol}</div>
                      <div className="text-xs text-gray-400 truncate">
                        {stock.company_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-white">
                        {formatPrice(stock.price)}
                      </div>
                      <div className={`text-xs flex items-center gap-1 ${
                        stock.change_percent >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {stock.change_percent >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {stock.change_percent >= 0 ? '+' : ''}
                        {stock.change_percent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Hackathons */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Upcoming Hackathons</h2>
                <Trophy className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-4">
                {hackathons.slice(0, 3).map((hackathon) => (
                  <div key={hackathon.id} className="border-b border-gray-800 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1 line-clamp-2">
                          {hackathon.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded-full">
                            {hackathon.platform}
                          </span>
                          {hackathon.prize_amount && (
                            <span className="text-xs text-green-400">
                              ${hackathon.prize_amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {hackathon.start_date && formatDate(hackathon.start_date)}
                          {hackathon.is_virtual && ' • Virtual'}
                        </div>
                        {hackathon.url && (
                          <a
                            href={hackathon.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors mt-2"
                          >
                            Learn more
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}