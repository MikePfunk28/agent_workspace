import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { 
  Play, 
  Save, 
  Settings, 
  Brain, 
  Target, 
  Zap,
  Clock,
  DollarSign,
  AlertCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkflowDefinition, ModelCapabilities } from '@/types/workflow'
import { ModelSelector } from './ModelSelector'
import { WorkflowVisualization } from './WorkflowVisualization'

interface WorkflowBuilderProps {
  onWorkflowCreate: (workflow: Partial<WorkflowDefinition>) => void
  onWorkflowSave?: (workflow: Partial<WorkflowDefinition>) => void
  initialWorkflow?: Partial<WorkflowDefinition>
}

interface WorkflowFormData {
  name: string
  description: string
  userIntent: string
  domain: string
  complexity: 'simple' | 'medium' | 'complex' | 'expert'
  costLimit: number
  timeLimit: number
  enableResearch: boolean
  enableValidation: boolean
  useAntagonist: boolean
}

const domains = [
  { id: 'biology', name: 'Biology & Life Sciences', icon: '🧬' },
  { id: 'finance', name: 'Finance & Economics', icon: '💹' },
  { id: 'research', name: 'Research & Analysis', icon: '🔬' },
  { id: 'engineering', name: 'Engineering & Tech', icon: '⚙️' },
  { id: 'healthcare', name: 'Healthcare & Medicine', icon: '🏥' },
  { id: 'education', name: 'Education & Training', icon: '🎓' },
  { id: 'business', name: 'Business & Strategy', icon: '📊' },
  { id: 'creative', name: 'Creative & Design', icon: '🎨' },
]

const complexityLevels = [
  {
    value: 'simple' as const,
    name: 'Simple',
    description: 'Basic workflow with 1-3 agents',
    agents: '1-3',
    estimatedTime: '2-5 min',
    color: 'bg-green-500/10 border-green-500/20 text-green-400'
  },
  {
    value: 'medium' as const,
    name: 'Medium',
    description: 'Multi-step workflow with validation',
    agents: '4-6',
    estimatedTime: '5-15 min',
    color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
  },
  {
    value: 'complex' as const,
    name: 'Complex',
    description: 'Advanced workflow with research & synthesis',
    agents: '7-10',
    estimatedTime: '15-30 min',
    color: 'bg-orange-500/10 border-orange-500/20 text-orange-400'
  },
  {
    value: 'expert' as const,
    name: 'Expert',
    description: 'Comprehensive workflow with full validation',
    agents: '10+',
    estimatedTime: '30+ min',
    color: 'bg-red-500/10 border-red-500/20 text-red-400'
  }
]

export function WorkflowBuilder({ onWorkflowCreate, onWorkflowSave, initialWorkflow }: WorkflowBuilderProps) {
  const [currentStep, setCurrentStep] = useState<'intent' | 'configuration' | 'preview'>('intent')
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [modelCapabilities, setModelCapabilities] = useState<ModelCapabilities | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [generatedWorkflow, setGeneratedWorkflow] = useState<Partial<WorkflowDefinition> | null>(null)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<WorkflowFormData>({
    defaultValues: {
      name: initialWorkflow?.name || '',
      description: initialWorkflow?.description || '',
      userIntent: initialWorkflow?.userIntent || '',
      domain: initialWorkflow?.domain || 'research',
      complexity: initialWorkflow?.complexity || 'medium',
      costLimit: 50,
      timeLimit: 30,
      enableResearch: true,
      enableValidation: true,
      useAntagonist: false,
      ...initialWorkflow
    }
  })

  const watchedValues = watch()

  const handleIntentAnalysis = async (data: WorkflowFormData) => {
    // Simulate workflow generation based on intent
    const mockWorkflow: Partial<WorkflowDefinition> = {
      name: data.name,
      description: data.description,
      userIntent: data.userIntent,
      domain: data.domain,
      complexity: data.complexity,
      agents: generateAgentsByComplexity(data.complexity),
      steps: generateStepsByIntent(data.userIntent, data.complexity),
      validation: {
        quality_checks: [
          { type: 'factual', description: 'Verify factual accuracy', auto_fix: false, criticality: 'high' },
          { type: 'completeness', description: 'Check output completeness', auto_fix: true, criticality: 'medium' }
        ],
        use_antagonist: data.useAntagonist,
        domain_validators: [`${data.domain}_validator`]
      }
    }
    
    setGeneratedWorkflow(mockWorkflow)
    setCurrentStep('preview')
  }

  const generateAgentsByComplexity = (complexity: string) => {
    const baseAgents = [
      { id: 'researcher', role: 'researcher' as const, name: 'Research Agent', description: 'Gathers and analyzes information' },
      { id: 'analyzer', role: 'analyzer' as const, name: 'Analysis Agent', description: 'Processes and structures data' }
    ]

    if (complexity === 'medium' || complexity === 'complex' || complexity === 'expert') {
      baseAgents.push(
        { id: 'validator', role: 'validator' as const, name: 'Validation Agent', description: 'Verifies accuracy and quality' }
      )
    }

    if (complexity === 'complex' || complexity === 'expert') {
      baseAgents.push(
        { id: 'synthesizer', role: 'synthesizer' as const, name: 'Synthesis Agent', description: 'Combines multiple perspectives' },
        { id: 'specialist', role: 'specialist' as const, name: 'Domain Specialist', description: 'Provides domain expertise' }
      )
    }

    if (complexity === 'expert') {
      baseAgents.push(
        { id: 'antagonist', role: 'antagonist' as const, name: 'Adversarial Agent', description: 'Challenges assumptions' },
        { id: 'coordinator', role: 'coordinator' as const, name: 'Coordination Agent', description: 'Manages workflow execution' }
      )
    }

    return baseAgents.map(agent => ({
      ...agent,
      prompts: [],
      tools: [],
      validation_rules: [],
      communication_style: 'structured' as const,
      error_handling: 'escalate' as const
    }))
  }

  const generateStepsByIntent = (intent: string, complexity: string) => {
    // Generate steps based on intent analysis
    const steps = [
      {
        id: 'research',
        sequence: 1,
        name: 'Research Phase',
        description: 'Gather relevant information',
        agent_id: 'researcher',
        input_sources: ['user_intent'],
        output_format: {
          format: 'structured' as const,
          required_fields: ['findings', 'sources', 'key_insights'],
          validation_rules: [],
          model_specific_formatting: {}
        },
        dependencies: [],
        retry_config: {
          max_retries: 3,
          backoff_strategy: 'exponential' as const,
          retry_conditions: ['timeout', 'validation_failure'],
          escalation_steps: ['human_review']
        }
      }
    ]

    if (complexity !== 'simple') {
      steps.push({
        id: 'analysis',
        sequence: 2,
        name: 'Analysis Phase',
        description: 'Analyze and structure findings',
        agent_id: 'analyzer',
        input_sources: ['research'],
        output_format: {
          format: 'structured' as const,
          required_fields: ['analysis', 'recommendations'],
          validation_rules: [],
          model_specific_formatting: {}
        },
        dependencies: ['research'],
        retry_config: {
          max_retries: 3,
          backoff_strategy: 'exponential' as const,
          retry_conditions: ['timeout', 'validation_failure'],
          escalation_steps: ['human_review']
        }
      })
    }

    return steps
  }

  const handleWorkflowExecute = () => {
    if (generatedWorkflow) {
      onWorkflowCreate(generatedWorkflow)
    }
  }

  const handleWorkflowSaveAction = () => {
    if (generatedWorkflow && onWorkflowSave) {
      onWorkflowSave(generatedWorkflow)
    }
  }

  if (currentStep === 'preview' && generatedWorkflow) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Workflow Preview</h2>
            <p className="text-gray-400">Review your generated workflow before execution</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentStep('intent')}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Back to Edit
            </button>
            {onWorkflowSave && (
              <button
                onClick={handleWorkflowSaveAction}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Workflow
              </button>
            )}
            <button
              onClick={handleWorkflowExecute}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              Execute Workflow
            </button>
          </div>
        </div>

        {/* Workflow Visualization */}
        <WorkflowVisualization workflow={generatedWorkflow} />

        {/* Workflow Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Workflow Configuration</h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-400">Domain:</span>
                <span className="text-white ml-2 capitalize">{generatedWorkflow.domain}</span>
              </div>
              <div>
                <span className="text-gray-400">Complexity:</span>
                <span className="text-white ml-2 capitalize">{generatedWorkflow.complexity}</span>
              </div>
              <div>
                <span className="text-gray-400">Agents:</span>
                <span className="text-white ml-2">{generatedWorkflow.agents?.length || 0} agents</span>
              </div>
              <div>
                <span className="text-gray-400">Steps:</span>
                <span className="text-white ml-2">{generatedWorkflow.steps?.length || 0} steps</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Model Configuration</h3>
            {selectedModel ? (
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Model:</span>
                  <span className="text-white ml-2">{selectedModel}</span>
                </div>
                {modelCapabilities && (
                  <>
                    <div>
                      <span className="text-gray-400">Reasoning:</span>
                      <div className="flex items-center gap-1 ml-2">
                        {Array.from({ length: modelCapabilities.reasoning_strength }).map((_, i) => (
                          <div key={i} className="w-2 h-2 bg-blue-500 rounded-full" />
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Context Window:</span>
                      <span className="text-white ml-2">{modelCapabilities.context_window.toLocaleString()} tokens</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-gray-400">No model selected</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-400" />
            AI Workflow Builder
          </h2>
          <p className="text-gray-400">Create intelligent workflows tailored to your specific needs</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-4">
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
          currentStep === 'intent' ? "bg-blue-600 text-white" : "text-gray-400"
        )}>
          <Target className="w-4 h-4" />
          Intent & Configuration
        </div>
        <ChevronRight className="w-4 h-4 text-gray-500" />
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
          currentStep === 'configuration' ? "bg-blue-600 text-white" : "text-gray-400"
        )}>
          <Settings className="w-4 h-4" />
          Model Selection
        </div>
        <ChevronRight className="w-4 h-4 text-gray-500" />
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
          currentStep === 'preview' ? "bg-blue-600 text-white" : "text-gray-400"
        )}>
          <Brain className="w-4 h-4" />
          Preview & Execute
        </div>
      </div>

      <form onSubmit={handleSubmit(handleIntentAnalysis)} className="space-y-6">
        {/* Primary Configuration */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Define Your Intent
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Workflow Name</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Crohn's Disease Pathway Analysis"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Brief description of what this workflow will accomplish..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">What do you want to achieve? *</label>
              <textarea
                {...register('userIntent', { required: 'Intent is required' })}
                rows={6}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe your goal in detail. For example: 'I want to simulate and analyze the molecular pathways involved in Crohn's disease, focusing on inflammatory responses and potential therapeutic targets. The analysis should include literature review, pathway mapping, and identification of drug interaction points.'"
              />
              {errors.userIntent && <p className="text-red-400 text-sm mt-1">{errors.userIntent.message}</p>}
            </div>
          </div>
        </div>

        {/* Domain Selection */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Domain</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {domains.map((domain) => (
              <label key={domain.id} className="cursor-pointer">
                <input
                  type="radio"
                  {...register('domain')}
                  value={domain.id}
                  className="sr-only"
                />
                <div className={cn(
                  "border border-gray-600 rounded-lg p-4 text-center transition-all hover:border-blue-500",
                  watchedValues.domain === domain.id ? "border-blue-500 bg-blue-500/10" : "bg-gray-700"
                )}>
                  <div className="text-2xl mb-2">{domain.icon}</div>
                  <div className="text-sm font-medium text-white">{domain.name}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Complexity Level */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Complexity Level</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {complexityLevels.map((level) => (
              <label key={level.value} className="cursor-pointer">
                <input
                  type="radio"
                  {...register('complexity')}
                  value={level.value}
                  className="sr-only"
                />
                <div className={cn(
                  "border rounded-lg p-4 transition-all",
                  watchedValues.complexity === level.value 
                    ? `${level.color} border-current` 
                    : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                )}>
                  <div className="font-medium mb-2">{level.name}</div>
                  <div className="text-sm opacity-80 mb-3">{level.description}</div>
                  <div className="flex justify-between text-xs">
                    <span>Agents: {level.agents}</span>
                    <span>{level.estimatedTime}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        <ModelSelector
          selectedModel={selectedModel}
          onModelSelect={(model, capabilities) => {
            setSelectedModel(model)
            setModelCapabilities(capabilities)
          }}
          domain={watchedValues.domain}
          complexity={watchedValues.complexity}
        />

        {/* Advanced Options */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              Advanced Options
            </h3>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Cost Limit ($)
                  </label>
                  <input
                    type="number"
                    {...register('costLimit')}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    {...register('timeLimit')}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="5"
                    max="180"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('enableResearch')}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-300">Enable automated research and data gathering</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('enableValidation')}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-300">Enable output validation and quality checks</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('useAntagonist')}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-300">Use adversarial agent to challenge assumptions</span>
                  <div className="flex items-center gap-1 text-orange-400">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-xs">Expert level recommended</span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!selectedModel}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <Zap className="w-4 h-4" />
            Generate Workflow
          </button>
        </div>
      </form>
    </div>
  )
}