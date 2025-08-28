import React, { useState, useEffect } from 'react'
import { 
  Brain, 
  Zap, 
  Clock, 
  DollarSign, 
  Eye, 
  Code, 
  AlertTriangle, 
  CheckCircle, 
  Star,
  Cpu,
  Database,
  Globe,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModelCapabilities } from '@/types/workflow'

interface Model {
  id: string
  name: string
  provider: string
  type: 'api' | 'mcp' | 'local' | 'hybrid'
  capabilities: ModelCapabilities
  pricing: {
    inputPrice: number // per 1K tokens
    outputPrice: number // per 1K tokens
    currency: string
  }
  limitations: string[]
  strengths: string[]
  availability: 'high' | 'medium' | 'low'
  recommendedFor: string[]
}

const availableModels: Model[] = [
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    type: 'api',
    capabilities: {
      reasoning_strength: 5,
      context_window: 200000,
      supports_function_calling: true,
      supports_json_mode: true,
      supports_vision: true,
      supports_code_execution: false,
      error_prone_areas: ['Math computations', 'Recent events'],
      strengths: ['Complex reasoning', 'Code analysis', 'Long-context understanding']
    },
    pricing: { inputPrice: 3.0, outputPrice: 15.0, currency: 'USD' },
    limitations: ['Cannot execute code directly', 'Training cutoff April 2024'],
    strengths: ['Excellent at complex reasoning', 'Superior code understanding', 'Strong analytical capabilities'],
    availability: 'high',
    recommendedFor: ['research', 'analysis', 'biology', 'engineering']
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    type: 'api',
    capabilities: {
      reasoning_strength: 4,
      context_window: 128000,
      supports_function_calling: true,
      supports_json_mode: true,
      supports_vision: true,
      supports_code_execution: true,
      error_prone_areas: ['Extended reasoning chains', 'Domain-specific terminology'],
      strengths: ['Multimodal capabilities', 'Function calling', 'Code execution']
    },
    pricing: { inputPrice: 2.5, outputPrice: 10.0, currency: 'USD' },
    limitations: ['Shorter context than Claude', 'Can be verbose'],
    strengths: ['Great multimodal support', 'Reliable function calling', 'Good general performance'],
    availability: 'high',
    recommendedFor: ['creative', 'business', 'finance', 'education']
  },
  {
    id: 'llama-70b',
    name: 'Llama 2 70B',
    provider: 'Meta',
    type: 'local',
    capabilities: {
      reasoning_strength: 3,
      context_window: 4096,
      supports_function_calling: false,
      supports_json_mode: true,
      supports_vision: false,
      supports_code_execution: false,
      error_prone_areas: ['Complex reasoning', 'Function calling', 'Recent information'],
      strengths: ['Open source', 'Good for basic tasks', 'Privacy focused']
    },
    pricing: { inputPrice: 0.0, outputPrice: 0.0, currency: 'USD' },
    limitations: ['Limited reasoning capability', 'No function calling', 'Requires local setup'],
    strengths: ['Completely private', 'No API costs', 'Good for basic text generation'],
    availability: 'medium',
    recommendedFor: ['simple workflows', 'privacy-sensitive tasks']
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    type: 'api',
    capabilities: {
      reasoning_strength: 4,
      context_window: 32000,
      supports_function_calling: true,
      supports_json_mode: true,
      supports_vision: true,
      supports_code_execution: true,
      error_prone_areas: ['Creative writing', 'Nuanced analysis'],
      strengths: ['Search integration', 'Multimodal', 'Real-time information']
    },
    pricing: { inputPrice: 1.0, outputPrice: 3.0, currency: 'USD' },
    limitations: ['Less creative than other models', 'Can be overly factual'],
    strengths: ['Excellent at factual queries', 'Great search integration', 'Cost effective'],
    availability: 'high',
    recommendedFor: ['research', 'fact-checking', 'healthcare']
  }
]

interface ModelSelectorProps {
  selectedModel: string | null
  onModelSelect: (modelId: string, capabilities: ModelCapabilities) => void
  domain: string
  complexity: 'simple' | 'medium' | 'complex' | 'expert'
}

export function ModelSelector({ selectedModel, onModelSelect, domain, complexity }: ModelSelectorProps) {
  const [showComparison, setShowComparison] = useState(false)
  const [recommendedModels, setRecommendedModels] = useState<Model[]>([])

  useEffect(() => {
    // Calculate recommendations based on domain and complexity
    const scored = availableModels.map(model => {
      let score = 0
      
      // Domain compatibility
      if (model.recommendedFor.includes(domain)) score += 3
      
      // Complexity compatibility
      const complexityRequirements = {
        simple: 2,
        medium: 3,
        complex: 4,
        expert: 5
      }
      
      if (model.capabilities.reasoning_strength >= complexityRequirements[complexity]) {
        score += 2
      }
      
      // Function calling for complex workflows
      if ((complexity === 'complex' || complexity === 'expert') && model.capabilities.supports_function_calling) {
        score += 2
      }
      
      // Long context for complex tasks
      if (complexity !== 'simple' && model.capabilities.context_window > 100000) {
        score += 1
      }
      
      return { ...model, score }
    })
    
    const sorted = scored.sort((a, b) => b.score - a.score)
    setRecommendedModels(sorted)
  }, [domain, complexity])

  const getComplexityIcon = (reasoning: number) => {
    if (reasoning >= 5) return <Brain className="w-4 h-4 text-purple-400" />
    if (reasoning >= 4) return <Zap className="w-4 h-4 text-blue-400" />
    if (reasoning >= 3) return <Cpu className="w-4 h-4 text-green-400" />
    return <Database className="w-4 h-4 text-gray-400" />
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'high': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const estimateCost = (model: Model) => {
    // Rough estimation based on complexity and typical usage
    const tokensEstimate = {
      simple: 5000,
      medium: 15000,
      complex: 40000,
      expert: 80000
    }
    
    const tokens = tokensEstimate[complexity]
    const inputCost = (tokens * 0.7 * model.pricing.inputPrice) / 1000
    const outputCost = (tokens * 0.3 * model.pricing.outputPrice) / 1000
    
    return inputCost + outputCost
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-400" />
          AI Model Selection
        </h3>
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
        >
          {showComparison ? 'Hide' : 'Show'} Comparison
        </button>
      </div>

      {/* Quick Recommendations */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-gray-300">
            Recommended for {domain} · {complexity} complexity
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedModels.slice(0, 2).map((model) => (
            <div
              key={model.id}
              onClick={() => onModelSelect(model.id, model.capabilities)}
              className={cn(
                "border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-500",
                selectedModel === model.id 
                  ? "border-blue-500 bg-blue-500/10" 
                  : "border-gray-600 bg-gray-700"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-white">{model.name}</h4>
                  <p className="text-sm text-gray-400">{model.provider}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getComplexityIcon(model.capabilities.reasoning_strength)}
                  <span className="text-xs text-gray-400">{model.type}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-300">Est. Cost:</span>
                <span className="text-green-400">
                  ${estimateCost(model).toFixed(2)}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Globe className={getAvailabilityColor(model.availability)} />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  <span>{(model.capabilities.context_window / 1000).toFixed(0)}K</span>
                </div>
                {model.capabilities.supports_function_calling && (
                  <div className="flex items-center gap-1">
                    <Code className="w-3 h-3 text-green-400" />
                    <span>Functions</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Comparison Table */}
      {showComparison && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Model</th>
                <th className="text-center py-3 px-2 text-gray-300 font-medium">
                  <div className="flex items-center justify-center gap-1">
                    <Brain className="w-4 h-4" />
                    Reasoning
                  </div>
                </th>
                <th className="text-center py-3 px-2 text-gray-300 font-medium">
                  <div className="flex items-center justify-center gap-1">
                    <Database className="w-4 h-4" />
                    Context
                  </div>
                </th>
                <th className="text-center py-3 px-2 text-gray-300 font-medium">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Cost
                  </div>
                </th>
                <th className="text-center py-3 px-2 text-gray-300 font-medium">Capabilities</th>
                <th className="text-center py-3 px-2 text-gray-300 font-medium">Select</th>
              </tr>
            </thead>
            <tbody>
              {recommendedModels.map((model) => (
                <tr key={model.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-white">{model.name}</div>
                      <div className="text-sm text-gray-400">{model.provider}</div>
                      <div className={cn(
                        "inline-flex items-center gap-1 text-xs px-2 py-1 rounded mt-1",
                        model.type === 'api' ? "bg-blue-500/10 text-blue-400" :
                        model.type === 'local' ? "bg-green-500/10 text-green-400" :
                        "bg-purple-500/10 text-purple-400"
                      )}>
                        {model.type === 'api' && <Globe className="w-3 h-3" />}
                        {model.type === 'local' && <Shield className="w-3 h-3" />}
                        {model.type}
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-4 px-2">
                    <div className="flex justify-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-2 h-2 rounded-full mx-0.5",
                            i < model.capabilities.reasoning_strength 
                              ? "bg-blue-500" 
                              : "bg-gray-600"
                          )}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {model.capabilities.reasoning_strength}/5
                    </div>
                  </td>
                  <td className="text-center py-4 px-2">
                    <div className="text-white font-mono text-sm">
                      {(model.capabilities.context_window / 1000).toFixed(0)}K
                    </div>
                  </td>
                  <td className="text-center py-4 px-2">
                    <div className="text-green-400 font-medium">
                      ${estimateCost(model).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400">estimated</div>
                  </td>
                  <td className="text-center py-4 px-2">
                    <div className="flex justify-center gap-1 flex-wrap">
                      {model.capabilities.supports_function_calling && (
                        <div className="bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded">
                          Functions
                        </div>
                      )}
                      {model.capabilities.supports_vision && (
                        <div className="bg-purple-500/10 text-purple-400 text-xs px-2 py-1 rounded">
                          Vision
                        </div>
                      )}
                      {model.capabilities.supports_code_execution && (
                        <div className="bg-orange-500/10 text-orange-400 text-xs px-2 py-1 rounded">
                          Code
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="text-center py-4 px-2">
                    <button
                      onClick={() => onModelSelect(model.id, model.capabilities)}
                      className={cn(
                        "px-3 py-1 rounded text-sm font-medium transition-colors",
                        selectedModel === model.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      )}
                    >
                      {selectedModel === model.id ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        'Select'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected Model Details */}
      {selectedModel && (
        <div className="mt-6 bg-gray-700 rounded-lg p-4">
          {(() => {
            const model = availableModels.find(m => m.id === selectedModel)
            if (!model) return null
            
            return (
              <div>
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Selected: {model.name}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Strengths</h5>
                    <ul className="space-y-1">
                      {model.strengths.map((strength, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                          <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Limitations</h5>
                    <ul className="space-y-1">
                      {model.limitations.map((limitation, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                          <AlertTriangle className="w-3 h-3 text-orange-400 flex-shrink-0" />
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}