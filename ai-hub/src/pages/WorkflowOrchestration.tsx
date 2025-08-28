import React, { useState } from 'react'
import { WorkflowBuilder } from '@/components/WorkflowBuilder'
import { WorkflowVisualization } from '@/components/WorkflowVisualization'
import { MCPServerPreview } from '@/components/MCPServerPreview'
import { WorkflowDefinition, WorkflowExecution, MCPServerConfig } from '@/types/workflow'
import { Sparkles, Play, Settings, Package, ArrowLeft } from 'lucide-react'

type ViewMode = 'builder' | 'visualization' | 'mcp-preview'

export function WorkflowOrchestration() {
  const [currentView, setCurrentView] = useState<ViewMode>('builder')
  const [workflow, setWorkflow] = useState<Partial<WorkflowDefinition> | null>(null)
  const [execution, setExecution] = useState<WorkflowExecution | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  const handleWorkflowCreate = async (newWorkflow: Partial<WorkflowDefinition>) => {
    setWorkflow(newWorkflow)
    
    // Simulate workflow execution
    setIsExecuting(true)
    const mockExecution: WorkflowExecution = {
      id: `exec-${Date.now()}`,
      workflow_id: newWorkflow.id || 'generated',
      status: 'running',
      current_step: newWorkflow.steps?.[0]?.id || '',
      completed_steps: [],
      failed_steps: [],
      step_outputs: {},
      validation_results: {},
      start_time: new Date(),
      total_tokens_used: 0,
      cost_estimate: 0,
      errors: []
    }
    setExecution(mockExecution)

    // Simulate step execution
    if (newWorkflow.steps) {
      for (let i = 0; i < newWorkflow.steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        setExecution(prev => prev ? {
          ...prev,
          current_step: i < newWorkflow.steps!.length - 1 ? newWorkflow.steps![i + 1].id : '',
          completed_steps: [...prev.completed_steps, newWorkflow.steps![i].id],
          total_tokens_used: prev.total_tokens_used + Math.floor(Math.random() * 5000) + 1000,
          cost_estimate: prev.cost_estimate + Math.random() * 2
        } : null)
      }
      
      // Complete execution
      setExecution(prev => prev ? {
        ...prev,
        status: 'completed',
        end_time: new Date(),
        current_step: ''
      } : null)
    }
    
    setIsExecuting(false)
    setCurrentView('visualization')
  }

  const handleWorkflowSave = (workflow: Partial<WorkflowDefinition>) => {
    // TODO: Implement save to database
    console.log('Saving workflow:', workflow)
  }

  const handleMCPDeploy = (config: MCPServerConfig) => {
    // TODO: Implement deployment
    console.log('Deploying MCP server:', config)
  }

  const handleMCPDownload = (config: MCPServerConfig) => {
    // TODO: Implement download as ZIP
    console.log('Downloading MCP server:', config)
  }

  const navigateToView = (view: ViewMode) => {
    setCurrentView(view)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {currentView !== 'builder' && (
              <button
                onClick={() => setCurrentView('builder')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Builder
              </button>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-blue-400" />
                AI Workflow Orchestration
              </h1>
              <p className="text-gray-400 mt-2">
                Create intelligent workflows that adapt to your specific domain and requirements
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateToView('builder')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentView === 'builder'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              Builder
            </button>
            
            {workflow && (
              <>
                <button
                  onClick={() => navigateToView('visualization')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'visualization'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  Visualization
                </button>
                
                <button
                  onClick={() => navigateToView('mcp-preview')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'mcp-preview'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  MCP Server
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {currentView === 'builder' && (
          <WorkflowBuilder
            onWorkflowCreate={handleWorkflowCreate}
            onWorkflowSave={handleWorkflowSave}
            initialWorkflow={workflow || undefined}
          />
        )}

        {currentView === 'visualization' && workflow && (
          <WorkflowVisualization
            workflow={workflow}
            execution={execution || undefined}
            isExecuting={isExecuting}
            onStepClick={(stepId) => console.log('Step clicked:', stepId)}
            onAgentClick={(agentId) => console.log('Agent clicked:', agentId)}
            showValidationPoints={true}
          />
        )}

        {currentView === 'mcp-preview' && workflow && (
          <MCPServerPreview
            workflow={workflow}
            onDeploy={handleMCPDeploy}
            onDownload={handleMCPDownload}
          />
        )}

        {/* Empty State */}
        {currentView !== 'builder' && !workflow && (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <Sparkles className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">No Workflow Created</h3>
            <p className="text-gray-500 mb-6">
              Start by creating a workflow in the builder to see visualizations and generate MCP servers.
            </p>
            <button
              onClick={() => navigateToView('builder')}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Settings className="w-4 h-4" />
              Open Builder
            </button>
          </div>
        )}
      </div>
    </div>
  )
}