import React, { useRef, useEffect, useState } from 'react'
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Users, 
  Zap,
  Brain,
  Search,
  Shield,
  Target,
  GitBranch,
  Activity,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkflowDefinition, AgentDefinition, WorkflowStep, WorkflowExecution } from '@/types/workflow'

interface WorkflowVisualizationProps {
  workflow: Partial<WorkflowDefinition>
  execution?: WorkflowExecution
  isExecuting?: boolean
  onStepClick?: (stepId: string) => void
  onAgentClick?: (agentId: string) => void
  showValidationPoints?: boolean
}

interface NodePosition {
  x: number
  y: number
  width: number
  height: number
}

interface Connection {
  from: string
  to: string
  fromPosition: NodePosition
  toPosition: NodePosition
  type: 'data' | 'validation' | 'dependency'
}

const agentIcons: Record<string, React.ComponentType<any>> = {
  researcher: Search,
  analyzer: Brain,
  validator: Shield,
  antagonist: AlertTriangle,
  synthesizer: GitBranch,
  coordinator: Target,
  specialist: Users
}

const getAgentColor = (role: string) => {
  const colors = {
    researcher: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    analyzer: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    validator: 'bg-green-500/10 border-green-500/30 text-green-400',
    antagonist: 'bg-red-500/10 border-red-500/30 text-red-400',
    synthesizer: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    coordinator: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    specialist: 'bg-teal-500/10 border-teal-500/30 text-teal-400'
  }
  return colors[role as keyof typeof colors] || 'bg-gray-500/10 border-gray-500/30 text-gray-400'
}

const getStepStatus = (stepId: string, execution?: WorkflowExecution) => {
  if (!execution) return 'pending'
  
  if (execution.completed_steps.includes(stepId)) return 'completed'
  if (execution.failed_steps.includes(stepId)) return 'failed'
  if (execution.current_step === stepId) return 'running'
  
  return 'pending'
}

export function WorkflowVisualization({ 
  workflow, 
  execution, 
  isExecuting = false,
  onStepClick, 
  onAgentClick,
  showValidationPoints = true 
}: WorkflowVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({})
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  // Calculate layout and connections
  useEffect(() => {
    if (!workflow.agents || !workflow.steps) return

    const agentPositions: Record<string, NodePosition> = {}
    const stepPositions: Record<string, NodePosition> = {}
    
    // Layout agents in a row at the top
    const agentWidth = 200
    const agentHeight = 120
    const agentSpacing = 50
    const startX = 50
    
    workflow.agents.forEach((agent, index) => {
      agentPositions[agent.id] = {
        x: startX + index * (agentWidth + agentSpacing),
        y: 50,
        width: agentWidth,
        height: agentHeight
      }
    })

    // Layout steps in sequence below agents
    const stepWidth = 180
    const stepHeight = 100
    const stepSpacing = 100
    const stepsStartY = 250

    workflow.steps.forEach((step, index) => {
      const stepY = stepsStartY + Math.floor(index / 4) * (stepHeight + 50)
      const stepX = startX + (index % 4) * (stepWidth + stepSpacing)
      
      stepPositions[step.id] = {
        x: stepX,
        y: stepY,
        width: stepWidth,
        height: stepHeight
      }
    })

    setNodePositions({ ...agentPositions, ...stepPositions })

    // Calculate connections
    const newConnections: Connection[] = []
    
    workflow.steps.forEach((step) => {
      const stepPos = stepPositions[step.id]
      const agentPos = agentPositions[step.agent_id]
      
      if (stepPos && agentPos) {
        // Agent to step connection
        newConnections.push({
          from: step.agent_id,
          to: step.id,
          fromPosition: agentPos,
          toPosition: stepPos,
          type: 'data'
        })
      }
      
      // Step dependencies
      step.dependencies.forEach((depId) => {
        const depPos = stepPositions[depId]
        if (stepPos && depPos) {
          newConnections.push({
            from: depId,
            to: step.id,
            fromPosition: depPos,
            toPosition: stepPos,
            type: 'dependency'
          })
        }
      })
    })

    setConnections(newConnections)
  }, [workflow])

  const renderConnection = (connection: Connection, index: number) => {
    const { fromPosition, toPosition, type } = connection
    
    const startX = fromPosition.x + fromPosition.width / 2
    const startY = fromPosition.y + fromPosition.height
    const endX = toPosition.x + toPosition.width / 2
    const endY = toPosition.y
    
    // Create curved path
    const controlPoint1Y = startY + (endY - startY) * 0.3
    const controlPoint2Y = endY - (endY - startY) * 0.3
    
    const path = `M ${startX} ${startY} C ${startX} ${controlPoint1Y} ${endX} ${controlPoint2Y} ${endX} ${endY}`
    
    const strokeColor = type === 'validation' ? '#f59e0b' : type === 'dependency' ? '#10b981' : '#3b82f6'
    const strokeWidth = type === 'dependency' ? 2 : 1.5
    const strokeDasharray = type === 'validation' ? '4,4' : 'none'
    
    return (
      <g key={`connection-${index}`}>
        <path
          d={path}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          fill="none"
          opacity={0.6}
        />
        {/* Arrowhead */}
        <polygon
          points={`${endX},${endY} ${endX - 6},${endY - 10} ${endX + 6},${endY - 10}`}
          fill={strokeColor}
          opacity={0.8}
        />
      </g>
    )
  }

  const renderAgent = (agent: AgentDefinition) => {
    const position = nodePositions[agent.id]
    if (!position) return null

    const IconComponent = agentIcons[agent.role] || Users
    const isSelected = selectedNode === agent.id
    
    return (
      <g key={`agent-${agent.id}`}>
        <rect
          x={position.x}
          y={position.y}
          width={position.width}
          height={position.height}
          rx="8"
          className={cn(
            "border-2 transition-all cursor-pointer",
            getAgentColor(agent.role),
            isSelected && "ring-2 ring-blue-500 ring-opacity-50"
          )}
          onClick={() => {
            setSelectedNode(isSelected ? null : agent.id)
            onAgentClick?.(agent.id)
          }}
        />
        
        {/* Agent Icon */}
        <foreignObject
          x={position.x + 12}
          y={position.y + 12}
          width="24"
          height="24"
        >
          <IconComponent className="w-6 h-6" />
        </foreignObject>
        
        {/* Agent Name */}
        <text
          x={position.x + 12}
          y={position.y + 55}
          className="text-sm font-medium fill-current"
          style={{ fontSize: '14px' }}
        >
          {agent.name}
        </text>
        
        {/* Agent Role */}
        <text
          x={position.x + 12}
          y={position.y + 75}
          className="text-xs fill-current opacity-75"
          style={{ fontSize: '12px' }}
        >
          {agent.role}
        </text>
        
        {/* Status indicator */}
        {isExecuting && (
          <circle
            cx={position.x + position.width - 12}
            cy={position.y + 12}
            r="6"
            className="fill-green-400 animate-pulse"
          />
        )}
      </g>
    )
  }

  const renderStep = (step: WorkflowStep) => {
    const position = nodePositions[step.id]
    if (!position) return null

    const status = getStepStatus(step.id, execution)
    const isSelected = selectedNode === step.id
    
    const statusColors = {
      pending: 'bg-gray-500/10 border-gray-500/30',
      running: 'bg-blue-500/10 border-blue-500/30 animate-pulse',
      completed: 'bg-green-500/10 border-green-500/30',
      failed: 'bg-red-500/10 border-red-500/30'
    }
    
    const statusIcons = {
      pending: Clock,
      running: Play,
      completed: CheckCircle,
      failed: AlertTriangle
    }
    
    const StatusIcon = statusIcons[status]
    
    return (
      <g key={`step-${step.id}`}>
        <rect
          x={position.x}
          y={position.y}
          width={position.width}
          height={position.height}
          rx="6"
          className={cn(
            "border-2 transition-all cursor-pointer",
            statusColors[status],
            isSelected && "ring-2 ring-blue-500 ring-opacity-50"
          )}
          onClick={() => {
            setSelectedNode(isSelected ? null : step.id)
            onStepClick?.(step.id)
          }}
        />
        
        {/* Step sequence number */}
        <circle
          cx={position.x + 20}
          cy={position.y + 20}
          r="12"
          className="fill-gray-600"
        />
        <text
          x={position.x + 20}
          y={position.y + 25}
          textAnchor="middle"
          className="text-xs font-bold fill-white"
          style={{ fontSize: '10px' }}
        >
          {step.sequence}
        </text>
        
        {/* Status icon */}
        <foreignObject
          x={position.x + position.width - 30}
          y={position.y + 10}
          width="20"
          height="20"
        >
          <StatusIcon className="w-5 h-5" />
        </foreignObject>
        
        {/* Step name */}
        <text
          x={position.x + 45}
          y={position.y + 25}
          className="text-sm font-medium fill-current"
          style={{ fontSize: '13px' }}
        >
          {step.name.length > 20 ? step.name.substring(0, 20) + '...' : step.name}
        </text>
        
        {/* Step description */}
        <text
          x={position.x + 12}
          y={position.y + 45}
          className="text-xs fill-current opacity-75"
          style={{ fontSize: '11px' }}
        >
          {step.description.length > 25 ? step.description.substring(0, 25) + '...' : step.description}
        </text>
        
        {/* Parallel group indicator */}
        {step.parallel_group && (
          <rect
            x={position.x + 8}
            y={position.y + position.height - 20}
            width="30"
            height="12"
            rx="6"
            className="fill-orange-500/20"
          />
          <text
            x={position.x + 23}
            y={position.y + position.height - 11}
            textAnchor="middle"
            className="text-xs fill-orange-400"
            style={{ fontSize: '9px' }}
          >
            ||
          </text>
        )}
        
        {/* Progress bar for running steps */}
        {status === 'running' && (
          <rect
            x={position.x + 2}
            y={position.y + position.height - 4}
            width={position.width - 4}
            height="2"
            className="fill-blue-500 opacity-60"
          >
            <animate
              attributeName="width"
              values="0;100%;0"
              dur="2s"
              repeatCount="indefinite"
            />
          </rect>
        )}
      </g>
    )
  }

  // Calculate SVG dimensions
  const maxX = Math.max(...Object.values(nodePositions).map(p => p.x + p.width), 0)
  const maxY = Math.max(...Object.values(nodePositions).map(p => p.y + p.height), 0)
  const svgWidth = maxX + 100
  const svgHeight = maxY + 100

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Workflow Visualization
        </h3>
        
        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span>Data Flow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-green-500"></div>
              <span>Dependencies</span>
            </div>
            {showValidationPoints && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-yellow-500 border-dashed border-t-2"></div>
                <span>Validation</span>
              </div>
            )}
          </div>
          
          {/* Execution Status */}
          {execution && (
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded text-sm">
              {execution.status === 'running' && <Play className="w-4 h-4 text-green-400 animate-pulse" />}
              {execution.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-400" />}
              {execution.status === 'failed' && <AlertTriangle className="w-4 h-4 text-red-400" />}
              {execution.status === 'paused' && <Pause className="w-4 h-4 text-yellow-400" />}
              <span className="text-gray-300 capitalize">{execution.status}</span>
            </div>
          )}
        </div>
      </div>

      {/* Workflow Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{workflow.agents?.length || 0}</div>
          <div className="text-sm text-gray-400">Agents</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{workflow.steps?.length || 0}</div>
          <div className="text-sm text-gray-400">Steps</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {execution ? execution.completed_steps.length : 0}
          </div>
          <div className="text-sm text-gray-400">Completed</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">
            {execution ? Math.round((execution.completed_steps.length / (workflow.steps?.length || 1)) * 100) : 0}%
          </div>
          <div className="text-sm text-gray-400">Progress</div>
        </div>
      </div>

      {/* SVG Visualization */}
      <div className="bg-gray-900 rounded-lg overflow-auto" style={{ maxHeight: '600px' }}>
        <svg
          ref={svgRef}
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="text-gray-300"
        >
          {/* Grid Background */}
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="rgb(55, 65, 81)"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Connections */}
          {connections.map(renderConnection)}
          
          {/* Agents */}
          {workflow.agents?.map(renderAgent)}
          
          {/* Steps */}
          {workflow.steps?.map(renderStep)}
        </svg>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="mt-4 bg-gray-700 rounded-lg p-4">
          {(() => {
            const agent = workflow.agents?.find(a => a.id === selectedNode)
            const step = workflow.steps?.find(s => s.id === selectedNode)
            
            if (agent) {
              return (
                <div>
                  <h4 className="font-medium text-white mb-2">{agent.name}</h4>
                  <p className="text-sm text-gray-300 mb-2">{agent.description}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Role:</span>
                    <span className="capitalize text-gray-300">{agent.role}</span>
                  </div>
                </div>
              )
            }
            
            if (step) {
              return (
                <div>
                  <h4 className="font-medium text-white mb-2">{step.name}</h4>
                  <p className="text-sm text-gray-300 mb-2">{step.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Agent:</span>
                      <span className="ml-1 text-gray-300">
                        {workflow.agents?.find(a => a.id === step.agent_id)?.name || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Dependencies:</span>
                      <span className="ml-1 text-gray-300">{step.dependencies.length}</span>
                    </div>
                  </div>
                </div>
              )
            }
            
            return null
          })()}
        </div>
      )}
    </div>
  )
}