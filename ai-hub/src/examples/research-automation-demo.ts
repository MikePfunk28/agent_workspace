import { researchAutomationOrchestrator } from '@/services/ResearchAutomationOrchestrator'
import type { ResearchAutomationOptions } from '@/services/ResearchAutomationOrchestrator'

/**
 * Research Automation Demo
 * 
 * This demo showcases the complete research automation system in action.
 * It demonstrates how a user intent like "simulate biological pathways" 
 * gets transformed into a research-backed, optimized workflow automatically.
 */

/**
 * Demo 1: Biological Pathway Simulation
 * Shows the system researching biology domain and creating optimized workflow
 */
export async function demoBiologicalPathwaySimulation() {
  console.log('🧬 === Demo 1: Biological Pathway Simulation ===')
  
  const userIntent = "simulate biological pathways for drug discovery research"
  
  try {
    // Configure research automation for accuracy-optimized workflow
    const options: ResearchAutomationOptions = {
      optimizeFor: 'accuracy',
      shareTemplate: true, // Share successful template with community
      includeValidation: true
    }
    
    console.log(`🎯 User Intent: "${userIntent}"`)
    console.log(`⚙️ Options: Optimize for accuracy, community sharing enabled`)
    
    // Run the complete research automation pipeline
    const result = await researchAutomationOrchestrator.createResearchBackedWorkflow(
      userIntent,
      options
    )
    
    // Display results
    console.log('\n📊 === Research Results ===')
    console.log(`🔬 Domain: ${result.researchSummary.domain}`)
    console.log(`📚 Sources analyzed: ${result.researchSummary.sourcesAnalyzed}`)
    console.log(`🧪 Methodologies found: ${result.researchSummary.methodologiesFound}`)
    console.log(`🔍 Patterns identified: ${result.researchSummary.patternsIdentified}`)
    console.log(`📈 Confidence: ${(result.researchSummary.confidenceScore * 100).toFixed(1)}%`)
    
    console.log('\n⚡ === Generated Workflow ===')
    console.log(`📝 Name: ${result.workflow.name}`)
    console.log(`🎯 Complexity: ${result.workflow.complexity}`)
    console.log(`🤖 Agents: ${result.workflow.agents.length} specialized agents`)
    console.log(`📋 Steps: ${result.workflow.steps.length} research-backed steps`)
    console.log(`🛡️ Validation: ${result.workflow.validation.quality_checks.length} quality checks`)
    
    console.log('\n🎯 === Performance Predictions ===')
    console.log(`⏱️ Research time: ${result.performance.researchDuration}ms`)
    console.log(`⏰ Expected execution: ${result.performance.expectedExecutionTime}ms`)
    console.log(`🎰 Token usage: ${result.performance.expectedTokenUsage}`)
    console.log(`💰 Cost: $${result.performance.expectedCost.toFixed(3)}`)
    console.log(`🎖️ Confidence: ${(result.performance.confidenceLevel * 100).toFixed(1)}%`)
    
    console.log('\n💡 === Recommendations ===')
    result.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`)
    })
    
    // Execute the workflow
    console.log('\n🚀 === Executing Workflow ===')
    const executionResult = await researchAutomationOrchestrator.executeResearchBackedWorkflow(
      result.workflow,
      {
        target_pathways: ['MAPK signaling', 'p53 pathway', 'PI3K-AKT pathway'],
        simulation_parameters: {
          time_points: 100,
          cell_types: ['HeLa', 'MCF-7'],
          drug_concentrations: [0.1, 1.0, 10.0]
        }
      },
      {
        optimizeBeforeExecution: true,
        monitorPerformance: true,
        collectLearningData: true
      }
    )
    
    console.log('\n✅ === Execution Results ===')
    console.log(`🆔 Execution ID: ${executionResult.executionId}`)
    console.log(`📊 Status: ${executionResult.status}`)
    console.log(`⏱️ Duration: ${executionResult.duration}ms`)
    console.log(`🎰 Tokens used: ${executionResult.tokenUsage}`)
    console.log(`💰 Actual cost: $${executionResult.cost.toFixed(3)}`)
    console.log(`📈 Validation score: ${executionResult.outputs.validation_scores?.overall || 'N/A'}`)
    
    return result
    
  } catch (error) {
    console.error('❌ Demo failed:', error)
    throw error
  }
}

/**
 * Demo 2: Financial Risk Analysis
 * Shows system adapting to different domain with different requirements
 */
export async function demoFinancialRiskAnalysis() {
  console.log('\n💰 === Demo 2: Financial Risk Analysis ===')
  
  const userIntent = "analyze portfolio risk and optimize investment strategies using Monte Carlo simulation"
  
  try {
    const options: ResearchAutomationOptions = {
      domain: 'finance', // Explicit domain specification
      optimizeFor: 'speed', // Speed optimization for real-time trading
      shareTemplate: false, // Keep financial strategies private
      includeValidation: true
    }
    
    console.log(`🎯 User Intent: "${userIntent}"`)
    console.log(`⚙️ Options: Finance domain, speed-optimized, private template`)
    
    const result = await researchAutomationOrchestrator.createResearchBackedWorkflow(
      userIntent,
      options
    )
    
    // Show how the system adapted to finance domain
    console.log('\n🏦 === Finance Domain Adaptations ===')
    console.log(`🔬 Domain: ${result.researchSummary.domain}`)
    console.log(`🎯 Model: ${result.workflow.targetModel.name}`)
    console.log(`📊 Agents specialized for: ${result.workflow.agents.map(a => a.role).join(', ')}`)
    
    // Show domain-specific patterns
    if (result.insights?.performanceInsights) {
      console.log('\n📈 === Domain-Specific Insights ===')
      console.log(`⚡ Fastest configs: ${result.insights.performanceInsights.fastestConfigurations.join(', ')}`)
      console.log(`🎯 Most accurate: ${result.insights.performanceInsights.mostAccurateConfigurations.join(', ')}`)
      console.log(`💰 Cost-effective: ${result.insights.performanceInsights.costEffectiveConfigurations.join(', ')}`)
    }
    
    // Execute with financial data
    const executionResult = await researchAutomationOrchestrator.executeResearchBackedWorkflow(
      result.workflow,
      {
        portfolio: {
          assets: ['AAPL', 'GOOGL', 'TSLA', 'SPY', 'BTC'],
          weights: [0.25, 0.20, 0.15, 0.30, 0.10],
          value: 1000000
        },
        risk_parameters: {
          var_confidence: 0.95,
          time_horizon: '1Y',
          simulation_runs: 10000
        }
      }
    )
    
    console.log('\n💼 === Financial Analysis Results ===')
    console.log(`📊 Risk analysis: ${executionResult.status}`)
    console.log(`⏱️ Real-time performance: ${executionResult.duration}ms`)
    console.log(`💰 Trading cost efficiency: $${executionResult.cost.toFixed(4)}`)
    
    return result
    
  } catch (error) {
    console.error('❌ Financial demo failed:', error)
    throw error
  }
}

/**
 * Demo 3: Multi-Domain Comparison
 * Shows how system handles different domains and learns from them
 */
export async function demoMultiDomainComparison() {
  console.log('\n🌐 === Demo 3: Multi-Domain Learning ===')
  
  try {
    // Run multiple domains to show learning
    const domains = [
      { intent: "optimize machine learning hyperparameters", domain: "data_science" },
      { intent: "design efficient chemical synthesis pathways", domain: "chemistry" },
      { intent: "analyze software architecture for scalability", domain: "engineering" }
    ]
    
    const results = []
    
    for (const { intent, domain } of domains) {
      console.log(`\n🔍 Processing: ${domain} - "${intent}"`)
      
      const result = await researchAutomationOrchestrator.createResearchBackedWorkflow(
        intent,
        { domain, optimizeFor: 'accuracy' }
      )
      
      results.push({
        domain,
        intent,
        agentCount: result.workflow.agents.length,
        stepCount: result.workflow.steps.length,
        confidence: result.performance.confidenceLevel,
        researchTime: result.performance.researchDuration
      })
      
      console.log(`✅ ${domain}: ${result.workflow.agents.length} agents, ${result.workflow.steps.length} steps, ${(result.performance.confidenceLevel * 100).toFixed(1)}% confidence`)
    }
    
    // Show cross-domain learning insights
    console.log('\n📊 === Cross-Domain Learning Analysis ===')
    console.table(results)
    
    // Calculate system improvements
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    const avgResearchTime = results.reduce((sum, r) => sum + r.researchTime, 0) / results.length
    
    console.log(`📈 Average confidence: ${(avgConfidence * 100).toFixed(1)}%`)
    console.log(`⏱️ Average research time: ${avgResearchTime}ms`)
    console.log(`🧠 Domains learned: ${results.length}`)
    
    return results
    
  } catch (error) {
    console.error('❌ Multi-domain demo failed:', error)
    throw error
  }
}

/**
 * Demo 4: System Status and Performance
 * Shows system health and learning progress
 */
export async function demoSystemStatusAndHealth() {
  console.log('\n🏥 === Demo 4: System Health & Performance ===')
  
  try {
    const status = await researchAutomationOrchestrator.getSystemStatus()
    
    console.log('\n🔧 === Component Health ===')
    Object.entries(status.components).forEach(([name, health]) => {
      const statusEmoji = health.status === 'healthy' ? '✅' : 
                         health.status === 'degraded' ? '⚠️' : '❌'
      console.log(`${statusEmoji} ${name}: ${health.status} (${health.responseTime}ms, ${(health.errorRate * 100).toFixed(2)}% errors)`)
    })
    
    console.log('\n📊 === Performance Metrics ===')
    console.log(`🔬 Total workflows generated: ${status.performance.totalWorkflowsGenerated}`)
    console.log(`🚀 Total executions: ${status.performance.totalExecutions}`)
    console.log(`📈 Average success rate: ${(status.performance.averageSuccessRate * 100).toFixed(1)}%`)
    console.log(`⏱️ Average research time: ${status.performance.averageResearchTime}ms`)
    console.log(`🕐 System uptime: ${Math.round(status.performance.systemUptime / 1000 / 60)}m`)
    
    console.log('\n🧠 === Learning Progress ===')
    console.log(`📚 Domains learned: ${status.learning.domainsLearned}`)
    console.log(`🔍 Patterns extracted: ${status.learning.patternsExtracted}`)
    console.log(`📋 Templates generated: ${status.learning.templatesGenerated}`)
    console.log(`📈 Improvement rate: ${(status.learning.improvementRate * 100).toFixed(1)}%`)
    
    // Simulate system improvement from feedback
    console.log('\n📈 === Simulating System Improvement ===')
    const mockFeedback = [
      {
        workflowId: 'workflow_1',
        executionId: 'exec_1', 
        userId: 'user_1',
        rating: 4,
        issues: ['slow_execution', 'complex_setup'],
        suggestions: ['optimize_for_speed', 'simplify_interface'],
        timestamp: new Date()
      },
      {
        workflowId: 'workflow_2',
        executionId: 'exec_2',
        userId: 'user_2', 
        rating: 5,
        issues: [],
        suggestions: ['add_more_domains', 'improve_accuracy'],
        timestamp: new Date()
      }
    ]
    
    const improvementReport = await researchAutomationOrchestrator.improveSystemFromFeedback(mockFeedback)
    
    console.log(`🔧 Templates improved: ${improvementReport.templatesImproved}`)
    console.log(`🧠 Patterns learned: ${improvementReport.patternsLearned}`)
    console.log(`⚡ Workflows optimized: ${improvementReport.workflowsOptimized}`)
    console.log(`📈 Overall improvement: ${(improvementReport.overallImprovement * 100).toFixed(1)}%`)
    
    return status
    
  } catch (error) {
    console.error('❌ System status demo failed:', error)
    throw error
  }
}

/**
 * Run all demos in sequence
 */
export async function runAllDemos() {
  console.log('🚀 === Research Automation System - Complete Demo ===\n')
  
  try {
    console.log('Starting comprehensive demonstration of the Research Automation System...')
    console.log('This system can automatically research domains, extract methodologies,')
    console.log('learn from successful patterns, and generate optimized workflows.\n')
    
    // Demo 1: Biology domain
    await demoBiologicalPathwaySimulation()
    
    // Demo 2: Finance domain  
    await demoFinancialRiskAnalysis()
    
    // Demo 3: Multi-domain learning
    await demoMultiDomainComparison()
    
    // Demo 4: System health
    await demoSystemStatusAndHealth()
    
    console.log('\n🎉 === Demo Complete ===')
    console.log('The Research Automation System successfully demonstrated:')
    console.log('✅ Automatic domain research and methodology extraction')
    console.log('✅ Workflow learning and optimization from successful patterns')  
    console.log('✅ Adaptive template generation for different model capabilities')
    console.log('✅ Cross-domain knowledge transfer and pattern recognition')
    console.log('✅ Continuous system improvement from user feedback')
    console.log('✅ Real-time performance monitoring and health tracking')
    console.log('\nThe system is ready to transform any user intent into research-backed,')
    console.log('optimized workflows automatically! 🔬🤖✨')
    
  } catch (error) {
    console.error('❌ Demo suite failed:', error)
    throw error
  }
}

// Export demo functions for use in other parts of the application
export {
  demoBiologicalPathwaySimulation as demo1Biology,
  demoFinancialRiskAnalysis as demo2Finance, 
  demoMultiDomainComparison as demo3MultiDomain,
  demoSystemStatusAndHealth as demo4SystemHealth
}