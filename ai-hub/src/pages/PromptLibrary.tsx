import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Search,
  Plus,
  Filter,
  Star,
  StarOff,
  Play,
  Edit,
  Trash2,
  Copy,
  TrendingUp,
  Clock,
  User,
  Hash,
  BookOpen,
  Zap,
  Brain,
  Settings,
  Download
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface PromptTemplate {
  id: string
  user_id: string
  name: string
  description: string
  template: string
  variables: any[]
  category: string
  tags: string[]
  is_public: boolean
  usage_count: number
  rating_avg: number
  rating_count: number
  created_at: string
  updated_at: string
}

interface PromptExecution {
  id: string
  execution_time: number
  token_usage: any
  status: string
  created_at: string
}

export function PromptLibrary() {
  const { user } = useAuth()
  const [prompts, setPrompts] = useState<PromptTemplate[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [executions, setExecutions] = useState<PromptExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [showMyPrompts, setShowMyPrompts] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null)
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)

  const categories = ['all', 'research', 'development', 'productivity', 'creative', 'analysis', 'education']

  useEffect(() => {
    fetchPrompts()
    fetchFavorites()
    fetchRecentExecutions()
  }, [])

  const fetchPrompts = async () => {
    try {
      let query = supabase
        .from('prompt_templates')
        .select('*')
        .order('usage_count', { ascending: false })

      if (showMyPrompts && user) {
        query = query.eq('user_id', user.id)
      } else {
        query = query.eq('is_public', true)
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) throw error
      setPrompts(data || [])
    } catch (error) {
      console.error('Error fetching prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFavorites = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('prompt_favorites')
        .select('prompt_template_id')
        .eq('user_id', user.id)

      if (error) throw error
      setFavorites(new Set(data?.map(f => f.prompt_template_id) || []))
    } catch (error) {
      console.error('Error fetching favorites:', error)
    }
  }

  const fetchRecentExecutions = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('prompt_executions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setExecutions(data || [])
    } catch (error) {
      console.error('Error fetching executions:', error)
    }
  }

  const toggleFavorite = async (promptId: string) => {
    if (!user) return

    try {
      if (favorites.has(promptId)) {
        await supabase
          .from('prompt_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('prompt_template_id', promptId)
        
        setFavorites(prev => {
          const next = new Set(prev)
          next.delete(promptId)
          return next
        })
      } else {
        await supabase
          .from('prompt_favorites')
          .insert({
            user_id: user.id,
            prompt_template_id: promptId
          })
        
        setFavorites(prev => new Set(prev).add(promptId))
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const executePrompt = async (prompt: PromptTemplate, variables: Record<string, any>) => {
    if (!user) return

    setExecuting(true)
    try {
      const response = await fetch('/api/execute-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          templateId: prompt.id,
          variables,
          aiModel: 'gpt-4'
        })
      })

      const result = await response.json()
      if (response.ok) {
        setExecutionResult(result)
        fetchRecentExecutions() // Refresh execution history
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error executing prompt:', error)
      alert('Error executing prompt: ' + error.message)
    } finally {
      setExecuting(false)
    }
  }

  const filteredPrompts = prompts.filter(prompt => {
    if (showFavoritesOnly && !favorites.has(prompt.id)) return false
    if (searchTerm && !prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !prompt.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false
    }
    return true
  })

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Prompt Library</h1>
            <p className="text-gray-400 mt-2">
              Discover, create, and execute AI prompts with advanced reasoning capabilities
            </p>
          </div>
          <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            <span>Create Prompt</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search prompts..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showFavoritesOnly ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>Favorites</span>
              </button>
              
              <button
                onClick={() => setShowMyPrompts(!showMyPrompts)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showMyPrompts ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <User className="w-4 h-4" />
                <span>My Prompts</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Prompts</p>
                <p className="text-2xl font-bold text-white">{prompts.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">My Favorites</p>
                <p className="text-2xl font-bold text-white">{favorites.size}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Recent Executions</p>
                <p className="text-2xl font-bold text-white">{executions.length}</p>
              </div>
              <Zap className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Categories</p>
                <p className="text-2xl font-bold text-white">{categories.length - 1}</p>
              </div>
              <Hash className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Prompt Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPrompts.map(prompt => (
            <div key={prompt.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{prompt.name}</h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{prompt.description}</p>
                </div>
                <button
                  onClick={() => toggleFavorite(prompt.id)}
                  className="text-gray-400 hover:text-yellow-500 transition-colors ml-2"
                >
                  {favorites.has(prompt.id) ? 
                    <Star className="w-5 h-5 fill-current text-yellow-500" /> : 
                    <StarOff className="w-5 h-5" />
                  }
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2 py-1 text-xs rounded-full ${{
                  'research': 'bg-blue-900 text-blue-300',
                  'development': 'bg-green-900 text-green-300',
                  'productivity': 'bg-purple-900 text-purple-300',
                  'creative': 'bg-pink-900 text-pink-300',
                  'analysis': 'bg-orange-900 text-orange-300',
                  'education': 'bg-indigo-900 text-indigo-300'
                }[prompt.category] || 'bg-gray-900 text-gray-300'}`}>
                  {prompt.category}
                </span>
                {prompt.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{prompt.usage_count} uses</span>
                  </div>
                  {prompt.rating_avg > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-current text-yellow-500" />
                      <span>{prompt.rating_avg.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="text-xs">
                  {prompt.variables.length} variables
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedPrompt(prompt)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Execute</span>
                </button>
                <button className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                <button className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredPrompts.length === 0 && (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No prompts found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or create a new prompt.</p>
          </div>
        )}
      </div>

      {/* Prompt Execution Modal */}
      {selectedPrompt && (
        <PromptExecutionModal
          prompt={selectedPrompt}
          onClose={() => setSelectedPrompt(null)}
          onExecute={executePrompt}
          executing={executing}
          result={executionResult}
        />
      )}
    </Layout>
  )
}

// Prompt Execution Modal Component
function PromptExecutionModal({ 
  prompt, 
  onClose, 
  onExecute, 
  executing, 
  result 
}: {
  prompt: PromptTemplate
  onClose: () => void
  onExecute: (prompt: PromptTemplate, variables: Record<string, any>) => void
  executing: boolean
  result: any
}) {
  const [variables, setVariables] = useState<Record<string, any>>({})

  const handleExecute = () => {
    onExecute(prompt, variables)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">{prompt.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              ×
            </button>
          </div>
          <p className="text-gray-400 mt-2">{prompt.description}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Variables Input */}
          {prompt.variables.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Variables</h3>
              <div className="space-y-4">
                {prompt.variables.map((variable: any) => (
                  <div key={variable.name}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {variable.name} {variable.required && <span className="text-red-400">*</span>}
                    </label>
                    {variable.type === 'textarea' ? (
                      <textarea
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder={variable.description}
                        value={variables[variable.name] || ''}
                        onChange={(e) => setVariables(prev => ({ ...prev, [variable.name]: e.target.value }))}
                      />
                    ) : variable.type === 'select' ? (
                      <select
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={variables[variable.name] || ''}
                        onChange={(e) => setVariables(prev => ({ ...prev, [variable.name]: e.target.value }))}
                      >
                        <option value="">Select {variable.name}</option>
                        {variable.options?.map((option: string) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={variable.type || 'text'}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={variable.description}
                        value={variables[variable.name] || ''}
                        onChange={(e) => setVariables(prev => ({ ...prev, [variable.name]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Template Preview */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Template Preview</h3>
            <div className="bg-gray-900 rounded-lg p-4">
              <pre className="text-gray-300 whitespace-pre-wrap text-sm">
                {prompt.template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => 
                  variables[key] || `{{${key}}}`
                )}
              </pre>
            </div>
          </div>

          {/* Execution Result */}
          {result && (
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Result</h3>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-gray-300 whitespace-pre-wrap">{result.response}</div>
                {result.reasoning && Object.keys(result.reasoning).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Reasoning Analysis</h4>
                    <pre className="text-xs text-gray-500">
                      {JSON.stringify(result.reasoning, null, 2)}
                    </pre>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between text-xs text-gray-500">
                  <span>Execution Time: {result.execution_time}ms</span>
                  <span>Tokens: {result.token_usage?.total_tokens || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleExecute}
              disabled={executing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {executing ? (
                <>
                  <LoadingSpinner />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Execute Prompt</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}