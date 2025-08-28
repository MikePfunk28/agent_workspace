import { ModelCapabilities } from '@/types/workflow'

/**
 * Model Capability Analyzer
 * Analyzes AI model capabilities and determines optimal workflow strategies
 */

export interface ModelProfile {
  name: string
  type: 'api' | 'mcp' | 'local' | 'hybrid'
  capabilities: ModelCapabilities
  cost_per_token: number
  latency_ms: number
  reliability_score: number // 0-1
  specialized_domains: string[]
}

export class ModelAnalyzer {
  private static modelProfiles: Record<string, ModelProfile> = {
    'gpt-4': {
      name: 'GPT-4',
      type: 'api',
      capabilities: {
        reasoning_strength: 5,
        context_window: 128000,
        supports_function_calling: true,
        supports_json_mode: true,
        supports_vision: true,
        supports_code_execution: false,
        error_prone_areas: ['mathematical calculations', 'recent events'],
        strengths: ['reasoning', 'code generation', 'analysis', 'writing']
      },
      cost_per_token: 0.00003,
      latency_ms: 2000,
      reliability_score: 0.92,
      specialized_domains: ['general', 'coding', 'analysis', 'writing']
    },
    'gpt-3.5-turbo': {
      name: 'GPT-3.5 Turbo',
      type: 'api',
      capabilities: {
        reasoning_strength: 3,
        context_window: 16000,
        supports_function_calling: true,
        supports_json_mode: true,
        supports_vision: false,
        supports_code_execution: false,
        error_prone_areas: ['complex reasoning', 'multi-step logic', 'nuanced analysis'],
        strengths: ['speed', 'basic tasks', 'simple coding']
      },
      cost_per_token: 0.000002,
      latency_ms: 800,
      reliability_score: 0.78,
      specialized_domains: ['general', 'simple tasks']
    },
    'claude-3-opus': {
      name: 'Claude 3 Opus',
      type: 'mcp',
      capabilities: {
        reasoning_strength: 5,
        context_window: 200000,
        supports_function_calling: true,
        supports_json_mode: true,
        supports_vision: true,
        supports_code_execution: false,
        error_prone_areas: ['real-time data', 'recent events'],
        strengths: ['reasoning', 'analysis', 'research', 'writing', 'safety']
      },
      cost_per_token: 0.000075,
      latency_ms: 3000,
      reliability_score: 0.94,
      specialized_domains: ['research', 'analysis', 'safety-critical', 'writing']
    },
    'claude-3-haiku': {
      name: 'Claude 3 Haiku',
      type: 'mcp',
      capabilities: {
        reasoning_strength: 3,
        context_window: 200000,
        supports_function_calling: true,
        supports_json_mode: true,
        supports_vision: true,
        supports_code_execution: false,
        error_prone_areas: ['complex reasoning', 'specialized knowledge'],
        strengths: ['speed', 'basic analysis', 'simple tasks']
      },
      cost_per_token: 0.00000025,
      latency_ms: 500,
      reliability_score: 0.82,
      specialized_domains: ['general', 'fast tasks']
    },
    'llama-70b': {
      name: 'Llama 2 70B',
      type: 'local',
      capabilities: {
        reasoning_strength: 3,
        context_window: 4096,
        supports_function_calling: false,
        supports_json_mode: false,
        supports_vision: false,
        supports_code_execution: false,
        error_prone_areas: ['complex reasoning', 'structured output', 'following instructions'],
        strengths: ['privacy', 'cost-effective', 'code generation']
      },
      cost_per_token: 0, // Local execution
      latency_ms: 5000,
      reliability_score: 0.65,
      specialized_domains: ['privacy-sensitive', 'offline']
    },
    'gemini-pro': {
      name: 'Gemini Pro',
      type: 'api',
      capabilities: {
        reasoning_strength: 4,
        context_window: 32000,
        supports_function_calling: true,
        supports_json_mode: true,
        supports_vision: true,
        supports_code_execution: true,
        error_prone_areas: ['consistency', 'edge cases'],
        strengths: ['multimodal', 'code execution', 'reasoning']
      },
      cost_per_token: 0.000001,
      latency_ms: 1500,
      reliability_score: 0.85,
      specialized_domains: ['multimodal', 'coding', 'research']
    }
  }

  /**
   * Analyzes task complexity and recommends optimal model configuration
   */
  static analyzeWorkflowRequirements(
    userIntent: string,
    domain: string,
    complexity: 'simple' | 'medium' | 'complex' | 'expert'
  ): {
    recommendedModel: string
    workflowStrategy: WorkflowStrategy
    requiredSafeguards: Safeguard[]
    estimatedCost: number
    estimatedTime: number
  } {
    const domainRequirements = this.analyzeDomainRequirements(domain)
    const complexityRequirements = this.analyzeComplexityRequirements(complexity)
    
    // Find best model match
    const modelScores = Object.entries(this.modelProfiles).map(([name, profile]) => ({
      name,
      profile,
      score: this.calculateModelScore(profile, domainRequirements, complexityRequirements)
    }))
    
    const recommendedModel = modelScores.sort((a, b) => b.score - a.score)[0]
    
    return {
      recommendedModel: recommendedModel.name,
      workflowStrategy: this.generateWorkflowStrategy(
        recommendedModel.profile,
        complexity,
        domainRequirements
      ),
      requiredSafeguards: this.generateSafeguards(
        recommendedModel.profile,
        complexity,
        domain
      ),
      estimatedCost: this.estimateCost(userIntent, recommendedModel.profile),
      estimatedTime: this.estimateTime(complexity, recommendedModel.profile)
    }
  }

  /**
   * Generates model-specific workflow strategy
   */
  private static generateWorkflowStrategy(
    model: ModelProfile,
    complexity: string,
    domainReqs: DomainRequirements
  ): WorkflowStrategy {
    const strategy: WorkflowStrategy = {
      agentCount: 1,
      validationLevel: 'basic',
      promptStructure: 'direct',
      errorHandling: 'retry',
      parallelization: false,
      chainOfThought: false,
      antagonistValidation: false
    }

    // Adjust based on model capabilities
    if (model.capabilities.reasoning_strength <= 3) {
      // Weaker models need more structure
      strategy.promptStructure = 'structured'
      strategy.chainOfThought = true
      strategy.validationLevel = 'high'
      
      if (complexity === 'complex' || complexity === 'expert') {
        strategy.agentCount = 3
        strategy.antagonistValidation = true
        strategy.parallelization = true
      }
    }

    if (model.capabilities.reasoning_strength >= 4) {
      // Stronger models can handle more autonomy
      if (complexity === 'complex' || complexity === 'expert') {
        strategy.agentCount = 2
        strategy.parallelization = true
      }
    }

    // Domain-specific adjustments
    if (domainReqs.requiresHighAccuracy) {
      strategy.validationLevel = 'critical'
      strategy.antagonistValidation = true
    }

    if (domainReqs.requiresResearch) {
      strategy.agentCount += 1 // Add research agent
    }

    return strategy
  }

  /**
   * Generates safeguards based on model limitations
   */
  private static generateSafeguards(
    model: ModelProfile,
    complexity: string,
    domain: string
  ): Safeguard[] {
    const safeguards: Safeguard[] = []

    // Basic safeguards for all models
    safeguards.push({
      type: 'output_validation',
      description: 'Validate output format and structure',
      implementation: 'schema_check'
    })

    // Model-specific safeguards
    if (model.capabilities.reasoning_strength <= 3) {
      safeguards.push({
        type: 'step_by_step_validation',
        description: 'Validate each reasoning step',
        implementation: 'chain_validation'
      })
      
      safeguards.push({
        type: 'multiple_attempts',
        description: 'Generate multiple solutions and compare',
        implementation: 'consensus_check'
      })
    }

    // Domain-specific safeguards
    if (domain === 'medical' || domain === 'finance' || domain === 'legal') {
      safeguards.push({
        type: 'expert_validation',
        description: 'Require expert review for critical domains',
        implementation: 'human_review'
      })
    }

    // Error-prone area safeguards
    model.capabilities.error_prone_areas.forEach(area => {
      safeguards.push({
        type: 'specialized_validation',
        description: `Extra validation for ${area}`,
        implementation: 'specialized_checker'
      })
    })

    return safeguards
  }

  private static analyzeDomainRequirements(domain: string): DomainRequirements {
    const domainMap: Record<string, DomainRequirements> = {
      'biology': {
        requiresHighAccuracy: true,
        requiresResearch: true,
        requiresSpecializedKnowledge: true,
        safetyLevel: 'high'
      },
      'finance': {
        requiresHighAccuracy: true,
        requiresResearch: false,
        requiresSpecializedKnowledge: true,
        safetyLevel: 'critical'
      },
      'research': {
        requiresHighAccuracy: true,
        requiresResearch: true,
        requiresSpecializedKnowledge: false,
        safetyLevel: 'medium'
      },
      'general': {
        requiresHighAccuracy: false,
        requiresResearch: false,
        requiresSpecializedKnowledge: false,
        safetyLevel: 'low'
      }
    }

    return domainMap[domain] || domainMap['general']
  }

  private static analyzeComplexityRequirements(complexity: string): ComplexityRequirements {
    const complexityMap: Record<string, ComplexityRequirements> = {
      'simple': { steps: 1, reasoning_depth: 1, validation_needed: false },
      'medium': { steps: 3, reasoning_depth: 2, validation_needed: true },
      'complex': { steps: 5, reasoning_depth: 3, validation_needed: true },
      'expert': { steps: 8, reasoning_depth: 4, validation_needed: true }
    }

    return complexityMap[complexity]
  }

  private static calculateModelScore(
    model: ModelProfile,
    domain: DomainRequirements,
    complexity: ComplexityRequirements
  ): number {
    let score = 0

    // Reasoning strength weight
    score += model.capabilities.reasoning_strength * 0.4

    // Reliability weight
    score += model.reliability_score * 0.3

    // Cost efficiency (inverse of cost)
    score += (1 - Math.min(model.cost_per_token * 1000000, 1)) * 0.2

    // Speed (inverse of latency)
    score += (1 - Math.min(model.latency_ms / 10000, 1)) * 0.1

    // Domain specialization bonus
    if (model.specialized_domains.includes(domain.toString())) {
      score += 0.2
    }

    return score
  }

  private static estimateCost(userIntent: string, model: ModelProfile): number {
    // Rough estimation based on intent length and model cost
    const estimatedTokens = userIntent.length * 4 + 2000 // Input + output estimate
    return estimatedTokens * model.cost_per_token
  }

  private static estimateTime(complexity: string, model: ModelProfile): number {
    const complexityMultiplier = {
      'simple': 1,
      'medium': 2,
      'complex': 4,
      'expert': 8
    }

    return model.latency_ms * (complexityMultiplier[complexity as keyof typeof complexityMultiplier] || 1)
  }
}

// Supporting interfaces
interface DomainRequirements {
  requiresHighAccuracy: boolean
  requiresResearch: boolean
  requiresSpecializedKnowledge: boolean
  safetyLevel: 'low' | 'medium' | 'high' | 'critical'
}

interface ComplexityRequirements {
  steps: number
  reasoning_depth: number
  validation_needed: boolean
}

interface WorkflowStrategy {
  agentCount: number
  validationLevel: 'basic' | 'medium' | 'high' | 'critical'
  promptStructure: 'direct' | 'structured' | 'chain_of_thought'
  errorHandling: 'retry' | 'escalate' | 'validate'
  parallelization: boolean
  chainOfThought: boolean
  antagonistValidation: boolean
}

interface Safeguard {
  type: string
  description: string
  implementation: string
}