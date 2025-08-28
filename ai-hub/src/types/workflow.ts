// Core Workflow Types for AI Orchestration System
export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  
  // User intent and goals
  userIntent: string
  domain: string // 'biology', 'finance', 'research', etc.
  complexity: 'simple' | 'medium' | 'complex' | 'expert'
  
  // Target model configuration
  targetModel: {
    type: 'api' | 'mcp' | 'local' | 'hybrid'
    name: string // 'gpt-4', 'claude-3', 'llama-70b', etc.
    capabilities: ModelCapabilities
    limitations: string[]
  }
  
  // Workflow structure
  agents: AgentDefinition[]
  steps: WorkflowStep[]
  validation: ValidationConfig
  
  // Output configuration
  mcpServerConfig?: MCPServerConfig
  
  created_at: Date
  updated_at: Date
  user_id: string
}

export interface ModelCapabilities {
  reasoning_strength: 1 | 2 | 3 | 4 | 5 // 1=weak, 5=excellent
  context_window: number
  supports_function_calling: boolean
  supports_json_mode: boolean
  supports_vision: boolean
  supports_code_execution: boolean
  error_prone_areas: string[]
  strengths: string[]
}

export interface AgentDefinition {
  id: string
  role: AgentRole
  name: string
  description: string
  
  // Agent configuration based on model capabilities
  prompts: PromptChain[]
  tools: string[] // MCP tools, functions, etc.
  validation_rules: ValidationRule[]
  
  // Interaction patterns
  communication_style: 'direct' | 'chain_of_thought' | 'structured' | 'adversarial'
  error_handling: 'retry' | 'escalate' | 'validate' | 'abort'
}

export type AgentRole = 
  | 'researcher'        // RAG and information gathering
  | 'analyzer'          // Data analysis and processing
  | 'validator'         // Output verification and quality control
  | 'antagonist'        // Challenge assumptions and find flaws
  | 'synthesizer'       // Combine outputs from multiple agents
  | 'coordinator'       // Manage workflow execution
  | 'specialist'        // Domain-specific expertise

export interface PromptChain {
  id: string
  sequence: number
  prompt_template: string
  variables: Record<string, any>
  expected_output: OutputSpecification
  validation: ValidationRule[]
  
  // Model-specific adaptations
  model_adaptations: {
    [modelType: string]: {
      prompt_modifications?: string
      additional_constraints?: string[]
      verification_steps?: string[]
    }
  }
}

export interface WorkflowStep {
  id: string
  sequence: number
  name: string
  description: string
  
  // Execution details
  agent_id: string
  input_sources: string[] // Previous step IDs or external sources
  output_format: OutputSpecification
  
  // Parallel execution support
  parallel_group?: string
  dependencies: string[] // Step IDs that must complete first
  
  // Error handling
  retry_config: RetryConfig
  fallback_steps?: WorkflowStep[]
}

export interface ValidationConfig {
  // Output validation
  output_schema?: Record<string, any>
  quality_checks: QualityCheck[]
  
  // Cross-validation
  use_antagonist: boolean
  consensus_threshold?: number // For multiple agent agreement
  
  // Domain-specific validation
  domain_validators: string[] // Custom validation functions
}

export interface QualityCheck {
  type: 'schema' | 'semantic' | 'factual' | 'consistency' | 'completeness'
  description: string
  validation_prompt?: string
  auto_fix: boolean
  criticality: 'low' | 'medium' | 'high' | 'critical'
}

export interface ValidationRule {
  id: string
  type: 'format' | 'content' | 'logic' | 'factual'
  description: string
  validation_logic: string // Code or prompt for validation
  error_message: string
  auto_correct: boolean
}

export interface OutputSpecification {
  format: 'json' | 'text' | 'markdown' | 'structured' | 'custom'
  schema?: Record<string, any>
  required_fields: string[]
  validation_rules: ValidationRule[]
  
  // Model-specific formatting
  model_specific_formatting: {
    [modelType: string]: {
      output_constraints?: string[]
      formatting_instructions?: string
    }
  }
}

export interface RetryConfig {
  max_retries: number
  backoff_strategy: 'linear' | 'exponential'
  retry_conditions: string[]
  escalation_steps: string[]
}

export interface MCPServerConfig {
  name: string
  description: string
  version: string
  
  // Generated server details
  tools: MCPTool[]
  resources: MCPResource[]
  prompts: MCPPrompt[]
  
  // Deployment configuration
  runtime: 'node' | 'python' | 'deno' | 'bun'
  dependencies: string[]
  environment_variables: Record<string, string>
}

export interface MCPTool {
  name: string
  description: string
  input_schema: Record<string, any>
  implementation: string // Generated code
}

export interface MCPResource {
  uri: string
  name: string
  description: string
  mime_type: string
}

export interface MCPPrompt {
  name: string
  description: string
  arguments: Record<string, any>
  template: string
}

// Research and Learning Capabilities
export interface ResearchConfig {
  sources: ResearchSource[]
  learning_mode: 'automatic' | 'guided' | 'supervised'
  knowledge_extraction: {
    extract_workflows: boolean
    extract_prompts: boolean
    extract_validation_rules: boolean
  }
}

export interface ResearchSource {
  type: 'google' | 'arxiv' | 'pubmed' | 'github' | 'documentation' | 'rag'
  query: string
  max_results: number
  relevance_threshold: number
}

// Workflow Execution State
export interface WorkflowExecution {
  id: string
  workflow_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  
  current_step: string
  completed_steps: string[]
  failed_steps: string[]
  
  // Execution results
  step_outputs: Record<string, any>
  validation_results: Record<string, ValidationResult>
  
  // Performance metrics
  start_time: Date
  end_time?: Date
  total_tokens_used: number
  cost_estimate: number
  
  // Error tracking
  errors: WorkflowError[]
}

export interface ValidationResult {
  passed: boolean
  score: number // 0-1
  issues: ValidationIssue[]
  recommendations: string[]
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'suggestion'
  description: string
  severity: 1 | 2 | 3 | 4 | 5
  auto_fixable: boolean
  suggested_fix?: string
}

export interface WorkflowError {
  step_id: string
  error_type: string
  message: string
  stack_trace?: string
  recovery_action: string
  timestamp: Date
}

// Template System for Common Workflows
export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  
  // Template definition
  template: Partial<WorkflowDefinition>
  required_customizations: string[]
  
  // Usage statistics
  usage_count: number
  success_rate: number
  average_execution_time: number
  
  // Community features
  is_public: boolean
  rating: number
  reviews: Review[]
}

export interface Review {
  user_id: string
  rating: 1 | 2 | 3 | 4 | 5
  comment: string
  created_at: Date
}