import { semanticSearch } from '@/lib/semantic-search'
import { supabase } from '@/lib/supabase'
import { WorkflowDefinition, WorkflowStep, ValidationRule, AgentDefinition } from '@/types/workflow'

/**
 * KnowledgeExtractor - Extracts actionable workflow knowledge from various sources
 * 
 * This system:
 * - Converts research papers into workflow steps and methodologies
 * - Extracts validation rules and success criteria from domain literature  
 * - Identifies common patterns across similar tasks and domains
 * - Builds domain-specific agent libraries with specialized knowledge
 * - Creates structured knowledge that can be directly used in workflows
 */
export class KnowledgeExtractor {
  private static instance: KnowledgeExtractor
  private extractedKnowledge = new Map<string, ExtractedKnowledge>()
  private patternDatabase = new Map<string, KnowledgePattern>()

  static getInstance(): KnowledgeExtractor {
    if (!KnowledgeExtractor.instance) {
      KnowledgeExtractor.instance = new KnowledgeExtractor()
    }
    return KnowledgeExtractor.instance
  }

  /**
   * Main knowledge extraction pipeline
   */
  async extractKnowledgeForDomain(
    domain: string,
    sources: KnowledgeSource[],
    extractionOptions: ExtractionOptions = {}
  ): Promise<ExtractedKnowledge> {
    console.log(`🔍 Extracting knowledge for domain: ${domain} from ${sources.length} sources`)
    
    const knowledge: ExtractedKnowledge = {
      domain,
      extractedWorkflows: [],
      extractedPrompts: [],
      extractedValidationRules: [],
      extractedAgents: [],
      domainPatterns: [],
      bestPractices: [],
      commonPitfalls: [],
      toolRecommendations: [],
      extractionMetadata: {
        sourcesProcessed: sources.length,
        extractionDate: new Date(),
        confidence: 0,
        completeness: 0
      }
    }

    // Process sources in parallel for efficiency
    const extractionPromises = sources.map(source => 
      this.extractFromSource(source, extractionOptions)
    )

    const extractionResults = await Promise.all(extractionPromises)

    // Aggregate results
    for (const result of extractionResults) {
      if (result) {
        knowledge.extractedWorkflows.push(...result.workflows)
        knowledge.extractedPrompts.push(...result.prompts)
        knowledge.extractedValidationRules.push(...result.validationRules)
        knowledge.extractedAgents.push(...result.agents)
        knowledge.domainPatterns.push(...result.patterns)
        knowledge.bestPractices.push(...result.bestPractices)
        knowledge.commonPitfalls.push(...result.pitfalls)
        knowledge.toolRecommendations.push(...result.tools)
      }
    }

    // Post-process and deduplicate
    knowledge.extractedWorkflows = this.deduplicateWorkflows(knowledge.extractedWorkflows)
    knowledge.extractedPrompts = this.deduplicatePrompts(knowledge.extractedPrompts)
    knowledge.extractedValidationRules = this.deduplicateValidationRules(knowledge.extractedValidationRules)
    knowledge.extractedAgents = this.deduplicateAgents(knowledge.extractedAgents)
    knowledge.domainPatterns = this.identifyCommonPatterns(knowledge.domainPatterns)

    // Calculate quality metrics
    knowledge.extractionMetadata.confidence = this.calculateConfidenceScore(knowledge, sources)
    knowledge.extractionMetadata.completeness = this.calculateCompletenessScore(knowledge, extractionOptions)

    // Store extracted knowledge
    await this.storeExtractedKnowledge(domain, knowledge)

    console.log(`✅ Knowledge extraction complete: ${knowledge.extractedWorkflows.length} workflows, ${knowledge.extractedPrompts.length} prompts, ${knowledge.extractedValidationRules.length} rules`)
    return knowledge
  }

  /**
   * Extract workflow knowledge from academic papers
   */
  async extractFromPaper(
    paperContent: string,
    paperMetadata: PaperMetadata
  ): Promise<PaperExtraction> {
    console.log(`📄 Extracting from paper: ${paperMetadata.title}`)
    
    const extraction: PaperExtraction = {
      paperId: paperMetadata.id,
      title: paperMetadata.title,
      workflows: [],
      prompts: [],
      validationRules: [],
      agents: [],
      patterns: [],
      bestPractices: [],
      pitfalls: [],
      tools: [],
      extractedAt: new Date()
    }

    try {
      // 1. Extract methodology sections
      const methodologies = await this.extractMethodologies(paperContent, paperMetadata)
      
      // 2. Convert methodologies to workflows
      for (const methodology of methodologies) {
        const workflow = await this.convertMethodologyToWorkflow(methodology, paperMetadata)
        if (workflow) {
          extraction.workflows.push(workflow)
        }
      }

      // 3. Extract validation criteria
      const validationCriteria = await this.extractValidationCriteria(paperContent, paperMetadata)
      extraction.validationRules.push(...validationCriteria)

      // 4. Extract best practices and recommendations
      const practices = await this.extractBestPractices(paperContent, paperMetadata)
      extraction.bestPractices.push(...practices)

      // 5. Extract common pitfalls and limitations
      const pitfalls = await this.extractPitfalls(paperContent, paperMetadata)
      extraction.pitfalls.push(...pitfalls)

      // 6. Extract tool and technique recommendations
      const tools = await this.extractToolRecommendations(paperContent, paperMetadata)
      extraction.tools.push(...tools)

      // 7. Generate domain-specific agents based on expertise areas
      const agents = await this.generateDomainAgents(paperMetadata, methodologies, practices)
      extraction.agents.push(...agents)

      console.log(`📊 Paper extraction: ${extraction.workflows.length} workflows, ${extraction.validationRules.length} rules, ${extraction.bestPractices.length} practices`)

    } catch (error) {
      console.warn(`⚠️ Failed to extract from paper ${paperMetadata.title}:`, error)
    }

    return extraction
  }

  /**
   * Extract workflow patterns from GitHub repositories
   */
  async extractFromRepository(
    repoData: RepositoryData
  ): Promise<RepositoryExtraction> {
    console.log(`💻 Extracting from repository: ${repoData.name}`)
    
    const extraction: RepositoryExtraction = {
      repoId: repoData.id,
      name: repoData.name,
      workflows: [],
      prompts: [],
      validationRules: [],
      agents: [],
      patterns: [],
      bestPractices: [],
      pitfalls: [],
      tools: [],
      extractedAt: new Date()
    }

    try {
      // 1. Analyze workflow files (GitHub Actions, CI/CD, etc.)
      const workflowFiles = await this.findWorkflowFiles(repoData)
      for (const file of workflowFiles) {
        const workflow = await this.parseWorkflowFile(file, repoData)
        if (workflow) {
          extraction.workflows.push(workflow)
        }
      }

      // 2. Extract patterns from code structure
      const codePatterns = await this.extractCodePatterns(repoData)
      extraction.patterns.push(...codePatterns)

      // 3. Analyze README and documentation for best practices
      const documentation = await this.extractFromDocumentation(repoData)
      extraction.bestPractices.push(...documentation.bestPractices)
      extraction.pitfalls.push(...documentation.pitfalls)

      // 4. Extract testing patterns and validation approaches
      const testingPatterns = await this.extractTestingPatterns(repoData)
      extraction.validationRules.push(...testingPatterns)

      // 5. Identify tools and dependencies used
      const toolUsage = await this.extractToolUsage(repoData)
      extraction.tools.push(...toolUsage)

      console.log(`📊 Repository extraction: ${extraction.workflows.length} workflows, ${extraction.patterns.length} patterns`)

    } catch (error) {
      console.warn(`⚠️ Failed to extract from repository ${repoData.name}:`, error)
    }

    return extraction
  }

  /**
   * Build domain-specific agent library
   */
  async buildDomainAgentLibrary(
    domain: string,
    extractedKnowledge: ExtractedKnowledge
  ): Promise<DomainAgentLibrary> {
    console.log(`🤖 Building agent library for domain: ${domain}`)
    
    const library: DomainAgentLibrary = {
      domain,
      agents: [],
      agentTemplates: [],
      specializations: new Map(),
      createdAt: new Date()
    }

    // 1. Create specialized agents from extracted knowledge
    const specialistAgents = await this.createSpecialistAgents(extractedKnowledge)
    library.agents.push(...specialistAgents)

    // 2. Create agent templates for common patterns
    const templates = await this.createAgentTemplates(extractedKnowledge.domainPatterns)
    library.agentTemplates.push(...templates)

    // 3. Map specializations to use cases
    for (const agent of library.agents) {
      const specializations = this.identifyAgentSpecializations(agent, extractedKnowledge)
      library.specializations.set(agent.id, specializations)
    }

    // Store the library
    await this.storeDomainAgentLibrary(domain, library)

    console.log(`📚 Agent library created: ${library.agents.length} agents, ${library.agentTemplates.length} templates`)
    return library
  }

  // Private extraction methods
  private async extractFromSource(
    source: KnowledgeSource,
    options: ExtractionOptions
  ): Promise<SourceExtraction | null> {
    try {
      switch (source.type) {
        case 'academic_paper':
          const paperExtraction = await this.extractFromPaper(source.content, {
            id: source.id,
            title: source.title,
            authors: source.metadata?.authors || [],
            domain: source.metadata?.domain || 'general',
            year: source.metadata?.year || new Date().getFullYear()
          })
          return this.convertPaperExtractionToSource(paperExtraction)

        case 'github_repository':
          const repoExtraction = await this.extractFromRepository({
            id: source.id,
            name: source.title,
            description: source.content,
            url: source.url,
            metadata: source.metadata || {}
          })
          return this.convertRepoExtractionToSource(repoExtraction)

        case 'documentation':
          return await this.extractFromDocumentationSource(source)

        case 'existing_workflow':
          return await this.extractFromExistingWorkflow(source)

        default:
          console.warn(`Unknown source type: ${source.type}`)
          return null
      }
    } catch (error) {
      console.warn(`Failed to extract from source ${source.id}:`, error)
      return null
    }
  }

  private async extractMethodologies(
    content: string,
    metadata: PaperMetadata
  ): Promise<ExtractedMethodology[]> {
    // Extract structured methodologies from paper content
    // This would use NLP or AI to identify methodology sections
    const methodologies: ExtractedMethodology[] = []

    // Simple pattern matching for now - in production would use advanced NLP
    const methodologyPatterns = [
      /methodology|method|approach|procedure|protocol/gi,
      /step \d+|stage \d+|phase \d+/gi,
      /algorithm \d+|process \d+/gi
    ]

    const sentences = content.split(/[.!?]+/)
    const methodologySections = sentences.filter(sentence =>
      methodologyPatterns.some(pattern => pattern.test(sentence))
    )

    if (methodologySections.length > 0) {
      methodologies.push({
        name: `${metadata.title} Methodology`,
        steps: methodologySections.slice(0, 8), // Max 8 steps
        domain: metadata.domain,
        validation: [],
        confidence: 0.7,
        source: metadata.title
      })
    }

    return methodologies
  }

  private async convertMethodologyToWorkflow(
    methodology: ExtractedMethodology,
    metadata: PaperMetadata
  ): Promise<ExtractedWorkflow | null> {
    if (methodology.steps.length === 0) return null

    const workflow: ExtractedWorkflow = {
      name: methodology.name,
      description: `Workflow derived from ${metadata.title}`,
      domain: methodology.domain,
      steps: methodology.steps.map((step, index) => ({
        id: `step_${index + 1}`,
        sequence: index + 1,
        name: this.extractStepName(step),
        description: step.substring(0, 200),
        expectedInput: this.inferInputRequirements(step),
        expectedOutput: this.inferOutputRequirements(step),
        validationCriteria: []
      })),
      successCriteria: [],
      estimatedDuration: this.estimateWorkflowDuration(methodology.steps),
      confidence: methodology.confidence,
      source: metadata.title,
      extractedAt: new Date()
    }

    return workflow
  }

  private async extractValidationCriteria(
    content: string,
    metadata: PaperMetadata
  ): Promise<ExtractedValidationRule[]> {
    const rules: ExtractedValidationRule[] = []

    // Look for validation patterns in the content
    const validationPatterns = [
      /validat|verif|check|evaluat|assess|measur/gi,
      /criteria|requirement|standard|benchmark/gi,
      /accuracy|precision|recall|f-score|rmse/gi
    ]

    const sentences = content.split(/[.!?]+/)
    const validationSections = sentences.filter(sentence =>
      validationPatterns.some(pattern => pattern.test(sentence))
    )

    for (const section of validationSections.slice(0, 5)) { // Max 5 rules
      rules.push({
        name: this.extractRuleName(section),
        description: section.substring(0, 200),
        type: this.inferRuleType(section),
        implementation: this.generateRuleImplementation(section),
        domain: metadata.domain,
        confidence: 0.6,
        source: metadata.title
      })
    }

    return rules
  }

  private async extractBestPractices(
    content: string,
    metadata: PaperMetadata
  ): Promise<ExtractedBestPractice[]> {
    const practices: ExtractedBestPractice[] = []

    // Look for recommendation patterns
    const practicePatterns = [
      /recommend|suggest|should|best practice|guideline/gi,
      /important|crucial|essential|critical|key/gi,
      /avoid|prevent|mitigate|reduce|minimize/gi
    ]

    const sentences = content.split(/[.!?]+/)
    const practiceSections = sentences.filter(sentence =>
      practicePatterns.some(pattern => pattern.test(sentence))
    )

    for (const section of practiceSections.slice(0, 10)) { // Max 10 practices
      practices.push({
        title: this.extractPracticeTitle(section),
        description: section.substring(0, 300),
        category: this.categorizePractice(section),
        importance: this.assessImportance(section),
        domain: metadata.domain,
        source: metadata.title
      })
    }

    return practices
  }

  private async extractPitfalls(
    content: string,
    metadata: PaperMetadata
  ): Promise<ExtractedPitfall[]> {
    const pitfalls: ExtractedPitfall[] = []

    // Look for pitfall patterns
    const pitfallPatterns = [
      /limitation|drawback|problem|issue|challenge/gi,
      /fail|error|mistake|incorrect|wrong/gi,
      /avoid|prevent|careful|caution|warning/gi
    ]

    const sentences = content.split(/[.!?]+/)
    const pitfallSections = sentences.filter(sentence =>
      pitfallPatterns.some(pattern => pattern.test(sentence))
    )

    for (const section of pitfallSections.slice(0, 5)) { // Max 5 pitfalls
      pitfalls.push({
        description: section.substring(0, 300),
        severity: this.assessSeverity(section),
        prevention: this.generatePrevention(section),
        domain: metadata.domain,
        source: metadata.title
      })
    }

    return pitfalls
  }

  private async extractToolRecommendations(
    content: string,
    metadata: PaperMetadata
  ): Promise<ExtractedTool[]> {
    const tools: ExtractedTool[] = []

    // Look for tool mentions
    const toolPatterns = [
      /software|tool|package|library|framework/gi,
      /python|r|matlab|spss|stata|sas/gi,
      /github|repository|implementation/gi
    ]

    const sentences = content.split(/[.!?]+/)
    const toolSections = sentences.filter(sentence =>
      toolPatterns.some(pattern => pattern.test(sentence))
    )

    for (const section of toolSections.slice(0, 8)) { // Max 8 tools
      const toolName = this.extractToolName(section)
      if (toolName) {
        tools.push({
          name: toolName,
          description: section.substring(0, 200),
          category: this.categorizeToolUsage(section),
          domain: metadata.domain,
          source: metadata.title
        })
      }
    }

    return tools
  }

  // Helper methods for extraction
  private extractStepName(step: string): string {
    // Extract meaningful step name from description
    const words = step.split(' ').slice(0, 4)
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  private inferInputRequirements(step: string): string[] {
    // Infer what inputs this step needs
    const inputKeywords = ['data', 'input', 'parameter', 'value', 'file']
    return inputKeywords.filter(keyword => step.toLowerCase().includes(keyword))
  }

  private inferOutputRequirements(step: string): string[] {
    // Infer what outputs this step produces
    const outputKeywords = ['result', 'output', 'report', 'analysis', 'model']
    return outputKeywords.filter(keyword => step.toLowerCase().includes(keyword))
  }

  private estimateWorkflowDuration(steps: string[]): number {
    // Simple duration estimation based on step count and complexity
    return steps.length * 300000 // 5 minutes per step
  }

  private extractRuleName(section: string): string {
    return section.split(' ').slice(0, 5).join(' ').replace(/[^a-zA-Z0-9 ]/g, '')
  }

  private inferRuleType(section: string): 'format' | 'content' | 'logic' | 'factual' {
    if (section.includes('format') || section.includes('structure')) return 'format'
    if (section.includes('logic') || section.includes('consistent')) return 'logic'
    if (section.includes('fact') || section.includes('accurate')) return 'factual'
    return 'content'
  }

  private generateRuleImplementation(section: string): string {
    // Generate simple validation implementation
    return `validate_${this.extractRuleName(section).replace(/\s+/g, '_').toLowerCase()}`
  }

  // Additional helper methods would be implemented here...
  private deduplicateWorkflows(workflows: ExtractedWorkflow[]): ExtractedWorkflow[] {
    const unique = new Map<string, ExtractedWorkflow>()
    for (const workflow of workflows) {
      const key = `${workflow.name}-${workflow.domain}`
      if (!unique.has(key) || workflow.confidence > (unique.get(key)?.confidence || 0)) {
        unique.set(key, workflow)
      }
    }
    return Array.from(unique.values())
  }

  private deduplicatePrompts(prompts: ExtractedPrompt[]): ExtractedPrompt[] {
    return prompts // Simplified - would implement proper deduplication
  }

  private deduplicateValidationRules(rules: ExtractedValidationRule[]): ExtractedValidationRule[] {
    return rules // Simplified - would implement proper deduplication
  }

  private deduplicateAgents(agents: ExtractedAgent[]): ExtractedAgent[] {
    return agents // Simplified - would implement proper deduplication
  }

  private identifyCommonPatterns(patterns: KnowledgePattern[]): KnowledgePattern[] {
    return patterns // Simplified - would implement pattern analysis
  }

  private calculateConfidenceScore(knowledge: ExtractedKnowledge, sources: KnowledgeSource[]): number {
    // Calculate confidence based on source quality and extraction success
    return 0.8
  }

  private calculateCompletenessScore(knowledge: ExtractedKnowledge, options: ExtractionOptions): number {
    // Calculate completeness based on extraction coverage
    return 0.7
  }

  private async storeExtractedKnowledge(domain: string, knowledge: ExtractedKnowledge): Promise<void> {
    try {
      await supabase.from('extracted_knowledge').insert({
        domain,
        workflows: JSON.stringify(knowledge.extractedWorkflows),
        prompts: JSON.stringify(knowledge.extractedPrompts),
        validation_rules: JSON.stringify(knowledge.extractedValidationRules),
        agents: JSON.stringify(knowledge.extractedAgents),
        patterns: JSON.stringify(knowledge.domainPatterns),
        best_practices: JSON.stringify(knowledge.bestPractices),
        confidence: knowledge.extractionMetadata.confidence,
        completeness: knowledge.extractionMetadata.completeness,
        created_at: new Date()
      })
    } catch (error) {
      console.warn('Failed to store extracted knowledge:', error)
    }
  }

  // Additional placeholder methods...
  private convertPaperExtractionToSource(extraction: PaperExtraction): SourceExtraction {
    return {
      workflows: extraction.workflows,
      prompts: extraction.prompts,
      validationRules: extraction.validationRules,
      agents: extraction.agents,
      patterns: extraction.patterns,
      bestPractices: extraction.bestPractices,
      pitfalls: extraction.pitfalls,
      tools: extraction.tools
    }
  }

  private convertRepoExtractionToSource(extraction: RepositoryExtraction): SourceExtraction {
    return {
      workflows: extraction.workflows,
      prompts: extraction.prompts,
      validationRules: extraction.validationRules,
      agents: extraction.agents,
      patterns: extraction.patterns,
      bestPractices: extraction.bestPractices,
      pitfalls: extraction.pitfalls,
      tools: extraction.tools
    }
  }

  // More placeholder methods would be implemented...
  private async extractFromDocumentationSource(source: KnowledgeSource): Promise<SourceExtraction> {
    return {
      workflows: [],
      prompts: [],
      validationRules: [],
      agents: [],
      patterns: [],
      bestPractices: [],
      pitfalls: [],
      tools: []
    }
  }

  private async extractFromExistingWorkflow(source: KnowledgeSource): Promise<SourceExtraction> {
    return {
      workflows: [],
      prompts: [],
      validationRules: [],
      agents: [],
      patterns: [],
      bestPractices: [],
      pitfalls: [],
      tools: []
    }
  }

  // Additional methods would continue to be implemented...
}

// Type definitions for knowledge extraction
export interface KnowledgeSource {
  id: string
  type: 'academic_paper' | 'github_repository' | 'documentation' | 'existing_workflow'
  title: string
  content: string
  url: string
  metadata?: Record<string, any>
}

export interface ExtractionOptions {
  extractWorkflows?: boolean
  extractPrompts?: boolean
  extractValidationRules?: boolean
  extractAgents?: boolean
  extractPatterns?: boolean
  confidenceThreshold?: number
}

export interface ExtractedKnowledge {
  domain: string
  extractedWorkflows: ExtractedWorkflow[]
  extractedPrompts: ExtractedPrompt[]
  extractedValidationRules: ExtractedValidationRule[]
  extractedAgents: ExtractedAgent[]
  domainPatterns: KnowledgePattern[]
  bestPractices: ExtractedBestPractice[]
  commonPitfalls: ExtractedPitfall[]
  toolRecommendations: ExtractedTool[]
  extractionMetadata: {
    sourcesProcessed: number
    extractionDate: Date
    confidence: number
    completeness: number
  }
}

export interface ExtractedWorkflow {
  name: string
  description: string
  domain: string
  steps: ExtractedWorkflowStep[]
  successCriteria: string[]
  estimatedDuration: number
  confidence: number
  source: string
  extractedAt: Date
}

export interface ExtractedWorkflowStep {
  id: string
  sequence: number
  name: string
  description: string
  expectedInput: string[]
  expectedOutput: string[]
  validationCriteria: string[]
}

export interface ExtractedPrompt {
  name: string
  template: string
  variables: string[]
  domain: string
  purpose: string
  confidence: number
  source: string
}

export interface ExtractedValidationRule {
  name: string
  description: string
  type: 'format' | 'content' | 'logic' | 'factual'
  implementation: string
  domain: string
  confidence: number
  source: string
}

export interface ExtractedAgent {
  name: string
  role: string
  description: string
  expertise: string[]
  domain: string
  prompts: string[]
  tools: string[]
  confidence: number
  source: string
}

export interface KnowledgePattern {
  name: string
  description: string
  pattern: string
  frequency: number
  domain: string
  applicability: string[]
}

export interface ExtractedBestPractice {
  title: string
  description: string
  category: string
  importance: number
  domain: string
  source: string
}

export interface ExtractedPitfall {
  description: string
  severity: number
  prevention: string
  domain: string
  source: string
}

export interface ExtractedTool {
  name: string
  description: string
  category: string
  domain: string
  source: string
}

// Additional type definitions...
interface PaperMetadata {
  id: string
  title: string
  authors: string[]
  domain: string
  year: number
}

interface RepositoryData {
  id: string
  name: string
  description: string
  url: string
  metadata: Record<string, any>
}

interface ExtractedMethodology {
  name: string
  steps: string[]
  domain: string
  validation: string[]
  confidence: number
  source: string
}

interface PaperExtraction {
  paperId: string
  title: string
  workflows: ExtractedWorkflow[]
  prompts: ExtractedPrompt[]
  validationRules: ExtractedValidationRule[]
  agents: ExtractedAgent[]
  patterns: KnowledgePattern[]
  bestPractices: ExtractedBestPractice[]
  pitfalls: ExtractedPitfall[]
  tools: ExtractedTool[]
  extractedAt: Date
}

interface RepositoryExtraction {
  repoId: string
  name: string
  workflows: ExtractedWorkflow[]
  prompts: ExtractedPrompt[]
  validationRules: ExtractedValidationRule[]
  agents: ExtractedAgent[]
  patterns: KnowledgePattern[]
  bestPractices: ExtractedBestPractice[]
  pitfalls: ExtractedPitfall[]
  tools: ExtractedTool[]
  extractedAt: Date
}

interface SourceExtraction {
  workflows: ExtractedWorkflow[]
  prompts: ExtractedPrompt[]
  validationRules: ExtractedValidationRule[]
  agents: ExtractedAgent[]
  patterns: KnowledgePattern[]
  bestPractices: ExtractedBestPractice[]
  pitfalls: ExtractedPitfall[]
  tools: ExtractedTool[]
}

interface DomainAgentLibrary {
  domain: string
  agents: ExtractedAgent[]
  agentTemplates: AgentTemplate[]
  specializations: Map<string, string[]>
  createdAt: Date
}

interface AgentTemplate {
  name: string
  role: string
  description: string
  configurable_prompts: string[]
  required_tools: string[]
  use_cases: string[]
}

// Export singleton instance
export const knowledgeExtractor = KnowledgeExtractor.getInstance()