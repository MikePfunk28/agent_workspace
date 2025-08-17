import React from 'react'
import { Layout } from '@/components/Layout'
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react'

export function Analytics() {
  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analytics & Insights</h1>
          <p className="text-gray-400">
            Understand your AI research patterns and market trends
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300 text-sm font-medium">Papers Read</span>
            </div>
            <div className="text-2xl font-bold text-white">127</div>
            <div className="text-xs text-green-400 mt-1">+23% this month</div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-gray-300 text-sm font-medium">Research Hours</span>
            </div>
            <div className="text-2xl font-bold text-white">48.5</div>
            <div className="text-xs text-green-400 mt-1">+12% this week</div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-gray-300 text-sm font-medium">Collaborations</span>
            </div>
            <div className="text-2xl font-bold text-white">8</div>
            <div className="text-xs text-blue-400 mt-1">Active projects</div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-300 text-sm font-medium">Streak</span>
            </div>
            <div className="text-2xl font-bold text-white">15</div>
            <div className="text-xs text-gray-400 mt-1">Days active</div>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Advanced Analytics Coming Soon
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            We're developing comprehensive analytics to track your research patterns, 
            project progress, market insights, and personalized recommendations.
          </p>
        </div>
      </div>
    </Layout>
  )
}