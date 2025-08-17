import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Newsletter as NewsletterType } from '@/lib/supabase'
import { 
  Mail, 
  Calendar, 
  Eye, 
  Download,
  Settings,
  Clock,
  Zap,
  Send
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function Newsletter() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [newsletters, setNewsletters] = useState<NewsletterType[]>([])
  const [generating, setGenerating] = useState(false)
  const [selectedNewsletter, setSelectedNewsletter] = useState<NewsletterType | null>(null)

  useEffect(() => {
    fetchNewsletters()
  }, [])

  const fetchNewsletters = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .eq('user_id', user?.id)
        .order('generated_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setNewsletters(data || [])
    } catch (error) {
      console.error('Error fetching newsletters:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateDailyNewsletter = async () => {
    setGenerating(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-newsletter')
      if (error) throw error
      
      // Refresh newsletters list
      await fetchNewsletters()
    } catch (error) {
      console.error('Error generating newsletter:', error)
    } finally {
      setGenerating(false)
    }
  }

  const generateWeeklyNewsletter = async () => {
    setGenerating(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-newsletter')
      if (error) throw error
      
      // Refresh newsletters list
      await fetchNewsletters()
    } catch (error) {
      console.error('Error generating newsletter:', error)
    } finally {
      setGenerating(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNewsletterTypeColor = (type: string) => {
    return type === 'daily' ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">AI Intelligence Newsletter</h1>
            <p className="text-gray-400">
              Personalized daily and weekly reports on AI trends and insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={generateDailyNewsletter}
              disabled={generating}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Clock className="w-4 h-4" />
              Generate Daily
            </button>
            <button
              onClick={generateWeeklyNewsletter}
              disabled={generating}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Zap className="w-4 h-4" />
              Generate Weekly
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300 text-sm font-medium">Total Newsletters</span>
            </div>
            <div className="text-2xl font-bold text-white">{newsletters.length}</div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-green-400" />
              <span className="text-gray-300 text-sm font-medium">Daily Reports</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {newsletters.filter(n => n.type === 'daily').length}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <span className="text-gray-300 text-sm font-medium">Weekly Reports</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {newsletters.filter(n => n.type === 'weekly').length}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Send className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-300 text-sm font-medium">Sent</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {newsletters.filter(n => n.sent_at).length}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Newsletters List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Recent Newsletters</h2>
                <Settings className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-3">
                {newsletters.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No newsletters yet</p>
                    <p className="text-gray-500 text-xs mt-1">Generate your first report</p>
                  </div>
                ) : (
                  newsletters.map((newsletter) => (
                    <div
                      key={newsletter.id}
                      onClick={() => setSelectedNewsletter(newsletter)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedNewsletter?.id === newsletter.id
                          ? 'bg-blue-900/30 border-blue-700'
                          : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getNewsletterTypeColor(newsletter.type)}`}>
                          {newsletter.type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(newsletter.generated_at).split(',')[0]}
                        </span>
                      </div>
                      <h3 className="text-white font-medium text-sm line-clamp-2 mb-1">
                        {newsletter.title}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {formatDate(newsletter.generated_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Newsletter Preview */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              {selectedNewsletter ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">
                        {selectedNewsletter.title}
                      </h2>
                      <p className="text-gray-400 text-sm">
                        Generated on {formatDate(selectedNewsletter.generated_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                  
                  {/* Newsletter Content */}
                  <div 
                    className="bg-white rounded-lg p-6 max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: selectedNewsletter.content }}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">
                    Select a newsletter to preview
                  </h3>
                  <p className="text-gray-400">
                    Choose from your recent newsletters or generate a new one
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {generating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <LoadingSpinner size="lg" className="mb-4" />
              <h3 className="text-white font-medium mb-2">Generating Newsletter</h3>
              <p className="text-gray-400 text-sm">This may take a few moments...</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}