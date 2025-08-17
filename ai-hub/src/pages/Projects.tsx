import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Project } from '@/lib/supabase'
import { 
  Plus, 
  Github, 
  Star, 
  ExternalLink, 
  MoreHorizontal,
  FolderOpen,
  TrendingUp,
  Calendar,
  Tag
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function Projects() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-900/50 text-green-300'
      case 'planning': return 'bg-blue-900/50 text-blue-300'
      case 'paused': return 'bg-yellow-900/50 text-yellow-300'
      case 'completed': return 'bg-purple-900/50 text-purple-300'
      default: return 'bg-gray-900/50 text-gray-300'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Sample project data for demonstration
  const sampleProjects = [
    {
      id: '1',
      name: 'AI-Powered Code Review Assistant',
      description: 'Building an intelligent code review system that uses GPT-4 to provide automated feedback and suggestions for pull requests.',
      github_url: 'https://github.com/user/ai-code-review',
      status: 'active',
      technologies: ['Python', 'OpenAI API', 'GitHub Actions', 'FastAPI'],
      is_favorite: true,
      created_at: '2024-01-15T00:00:00Z',
      progress: 75
    },
    {
      id: '2',
      name: 'Stock Market Prediction ML Model',
      description: 'Developing a machine learning model to predict stock price movements using technical indicators and sentiment analysis.',
      github_url: 'https://github.com/user/stock-prediction',
      status: 'active',
      technologies: ['Python', 'TensorFlow', 'Pandas', 'yfinance'],
      is_favorite: false,
      created_at: '2024-02-01T00:00:00Z',
      progress: 60
    },
    {
      id: '3',
      name: 'Personal Knowledge Base RAG',
      description: 'Creating a retrieval-augmented generation system for personal document search and question answering.',
      github_url: null,
      status: 'planning',
      technologies: ['Python', 'LangChain', 'ChromaDB', 'Streamlit'],
      is_favorite: false,
      created_at: '2024-02-10T00:00:00Z',
      progress: 15
    }
  ]

  const displayProjects = projects.length > 0 ? projects : sampleProjects

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
            <h1 className="text-3xl font-bold text-white mb-2">My Projects</h1>
            <p className="text-gray-400">
              Track your AI/ML projects and implementation progress
            </p>
          </div>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300 text-sm font-medium">Total Projects</span>
            </div>
            <div className="text-2xl font-bold text-white">{displayProjects.length}</div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-gray-300 text-sm font-medium">Active</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {displayProjects.filter(p => p.status === 'active').length}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-300 text-sm font-medium">Favorites</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {displayProjects.filter(p => p.is_favorite).length}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Github className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300 text-sm font-medium">With GitHub</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {displayProjects.filter(p => p.github_url).length}
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayProjects.map((project) => (
            <div
              key={project.id}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:bg-gray-800/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  {project.is_favorite && (
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  )}
                </div>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Title */}
              <h3 className="text-white font-semibold mb-2 line-clamp-2">
                {project.name}
              </h3>

              {/* Description */}
              <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                {project.description}
              </p>

              {/* Progress Bar (if available) */}
              {(project as any).progress && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{(project as any).progress}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(project as any).progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Technologies */}
              <div className="flex flex-wrap gap-1 mb-4">
                {project.technologies.slice(0, 3).map((tech, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded-full"
                  >
                    {tech}
                  </span>
                ))}
                {project.technologies.length > 3 && (
                  <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded-full">
                    +{project.technologies.length - 3}
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(project.created_at)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  <button className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                    View
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {displayProjects.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              No projects yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first AI/ML project to get started
            </p>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Project
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}