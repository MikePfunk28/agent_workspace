import React from 'react'
import { Layout } from '@/components/Layout'
import { BookOpen, Search, Star, Plus, Tag, FileText, Lightbulb } from 'lucide-react'

export function Knowledge() {
  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Knowledge Base</h1>
            <p className="text-gray-400">
              Organize and search your AI research, prompts, and templates
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Add Knowledge
          </button>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:bg-gray-800/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Research Papers</h3>
                <p className="text-gray-400 text-sm">45 items</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">AI research papers and academic publications</p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:bg-gray-800/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">AI Prompts</h3>
                <p className="text-gray-400 text-sm">23 items</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">Curated prompts for various AI tasks</p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:bg-gray-800/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Code Templates</h3>
                <p className="text-gray-400 text-sm">12 items</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">Reusable code snippets and patterns</p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:bg-gray-800/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Notes</h3>
                <p className="text-gray-400 text-sm">8 items</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">Personal notes and insights</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search your knowledge base..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Coming Soon Message */}
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Knowledge Base Coming Soon
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            We're building an intelligent knowledge management system with vector search, 
            AI-powered organization, and semantic understanding of your research materials.
          </p>
        </div>
      </div>
    </Layout>
  )
}