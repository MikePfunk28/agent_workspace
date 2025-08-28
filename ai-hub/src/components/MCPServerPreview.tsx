import React, { useState, useEffect } from 'react'
import { 
  Package, 
  Copy, 
  Download, 
  Play, 
  Code, 
  Terminal, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  FileText,
  Settings,
  Zap,
  Upload,
  Globe,
  Server
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MCPServerConfig, MCPTool, WorkflowDefinition } from '@/types/workflow'

interface MCPServerPreviewProps {
  workflow: Partial<WorkflowDefinition>
  serverConfig?: MCPServerConfig
  onDeploy?: (config: MCPServerConfig) => void
  onDownload?: (config: MCPServerConfig) => void
}

interface GeneratedFile {
  name: string
  type: 'typescript' | 'javascript' | 'json' | 'markdown' | 'dockerfile'
  content: string
  size: number
}

const runtimeInfo = {
  node: {
    name: 'Node.js',
    icon: '⚡',
    description: 'Fast and reliable JavaScript runtime',
    version: '18+',
    color: 'text-green-400'
  },
  python: {
    name: 'Python',
    icon: '🐍',
    description: 'Perfect for data science and ML workflows',
    version: '3.9+',
    color: 'text-blue-400'
  },
  deno: {
    name: 'Deno',
    icon: '🦕',
    description: 'Secure TypeScript runtime with built-in tools',
    version: '1.30+',
    color: 'text-purple-400'
  },
  bun: {
    name: 'Bun',
    icon: '🥖',
    description: 'Ultra-fast all-in-one JavaScript runtime',
    version: '1.0+',
    color: 'text-orange-400'
  }
}

export function MCPServerPreview({ workflow, serverConfig, onDeploy, onDownload }: MCPServerPreviewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tools' | 'code' | 'deployment'>('overview')
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const [generatedConfig, setGeneratedConfig] = useState<MCPServerConfig | null>(null)
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([])

  // Generate MCP server configuration based on workflow
  useEffect(() => {
    if (!workflow.userIntent) return

    const config: MCPServerConfig = {
      name: workflow.name ? `${workflow.name.toLowerCase().replace(/\s+/g, '-')}-mcp` : 'ai-workflow-mcp',
      description: workflow.description || `AI-powered MCP server for ${workflow.domain} workflows`,
      version: '1.0.0',
      runtime: 'node',
      dependencies: [
        '@modelcontextprotocol/sdk',
        'zod',
        'openai',
        'anthropic'
      ],
      environment_variables: {
        'OPENAI_API_KEY': 'your-openai-api-key',
        'ANTHROPIC_API_KEY': 'your-anthropic-api-key',
        'WORKFLOW_DOMAIN': workflow.domain || 'general'
      },
      tools: generateToolsFromWorkflow(workflow),
      resources: generateResourcesFromWorkflow(workflow),
      prompts: generatePromptsFromWorkflow(workflow)
    }

    // Add domain-specific dependencies
    switch (workflow.domain) {
      case 'biology':
        config.dependencies.push('bio-parsers', 'ncbi-eutils')
        break
      case 'finance':
        config.dependencies.push('alpha-vantage', 'yahoo-finance2')
        break
      case 'research':
        config.dependencies.push('arxiv-api', 'cheerio', 'pdf-parse')
        break
    }

    setGeneratedConfig(config)
    
    // Generate code files
    const files = generateCodeFiles(config, workflow)
    setGeneratedFiles(files)
  }, [workflow])

  const generateToolsFromWorkflow = (workflow: Partial<WorkflowDefinition>): MCPTool[] => {
    const tools: MCPTool[] = []

    // Add agent-specific tools
    workflow.agents?.forEach(agent => {
      switch (agent.role) {
        case 'researcher':
          tools.push({
            name: 'research_topic',
            description: 'Research a specific topic using multiple sources',
            input_schema: {
              type: 'object',
              properties: {
                topic: { type: 'string', description: 'Topic to research' },
                sources: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Preferred sources (arxiv, pubmed, google, etc.)' 
                },
                depth: { type: 'string', enum: ['basic', 'comprehensive'], default: 'comprehensive' }
              },
              required: ['topic']
            },
            implementation: generateResearchImplementation(workflow.domain || 'general')
          })
          break
        case 'analyzer':
          tools.push({
            name: 'analyze_data',
            description: 'Analyze structured or unstructured data',
            input_schema: {
              type: 'object',
              properties: {
                data: { type: 'string', description: 'Data to analyze' },
                analysis_type: { 
                  type: 'string', 
                  enum: ['statistical', 'semantic', 'trend', 'comparative'],
                  description: 'Type of analysis to perform'
                },
                format: { type: 'string', enum: ['json', 'markdown', 'csv'], default: 'json' }
              },
              required: ['data', 'analysis_type']
            },
            implementation: generateAnalysisImplementation(workflow.domain || 'general')
          })
          break
        case 'validator':
          tools.push({
            name: 'validate_output',
            description: 'Validate workflow output against quality criteria',
            input_schema: {
              type: 'object',
              properties: {
                content: { type: 'string', description: 'Content to validate' },
                criteria: { 
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Validation criteria'
                },
                domain: { type: 'string', description: 'Domain context for validation' }
              },
              required: ['content']
            },
            implementation: generateValidationImplementation(workflow.domain || 'general')
          })
          break
      }
    })

    // Add workflow orchestration tool
    tools.push({
      name: 'execute_workflow',
      description: 'Execute the complete AI workflow',
      input_schema: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'Workflow input data or query' },
          options: {
            type: 'object',
            properties: {
              model: { type: 'string', description: 'AI model to use' },
              complexity: { type: 'string', enum: ['simple', 'medium', 'complex', 'expert'] },
              validation_level: { type: 'string', enum: ['basic', 'standard', 'comprehensive'] }
            }
          }
        },
        required: ['input']
      },
      implementation: generateWorkflowImplementation(workflow)
    })

    return tools
  }

  const generateResourcesFromWorkflow = (workflow: Partial<WorkflowDefinition>) => {
    return [
      {
        uri: 'workflow://schema',
        name: 'Workflow Schema',
        description: 'JSON schema for workflow configuration',
        mime_type: 'application/json'
      },
      {
        uri: 'workflow://templates',
        name: 'Workflow Templates',
        description: 'Pre-built workflow templates',
        mime_type: 'application/json'
      }
    ]
  }

  const generatePromptsFromWorkflow = (workflow: Partial<WorkflowDefinition>) => {
    return [
      {
        name: 'analyze_intent',
        description: 'Analyze user intent and generate workflow plan',
        arguments: {
          intent: { type: 'string', description: 'User intent description' },
          domain: { type: 'string', description: 'Problem domain' }
        },
        template: `Analyze the following user intent and create a detailed workflow plan:

Intent: {{intent}}
Domain: {{domain}}

Please provide:
1. Breakdown of required steps
2. Recommended AI agents and their roles  
3. Validation checkpoints
4. Expected outcomes and deliverables`
      }
    ]
  }

  const generateResearchImplementation = (domain: string) => {
    return `async function researchTopic({ topic, sources = ['arxiv', 'pubmed', 'google'], depth = 'comprehensive' }) {
  const results = [];
  
  for (const source of sources) {
    switch (source) {
      case 'arxiv':
        // Implement arXiv API search
        const arxivResults = await searchArxiv(topic);
        results.push(...arxivResults);
        break;
      case 'pubmed':
        // Implement PubMed API search
        const pubmedResults = await searchPubmed(topic);
        results.push(...pubmedResults);
        break;
      case 'google':
        // Implement Google Scholar or general search
        const googleResults = await searchGoogle(topic);
        results.push(...googleResults);
        break;
    }
  }
  
  // Synthesize and rank results
  const synthesized = await synthesizeResults(results, depth);
  
  return {
    topic,
    sources_searched: sources,
    depth,
    findings: synthesized,
    metadata: {
      total_sources: results.length,
      search_timestamp: new Date().toISOString()
    }
  };
}`
  }

  const generateAnalysisImplementation = (domain: string) => {
    return `async function analyzeData({ data, analysis_type, format = 'json' }) {
  let analysis;
  
  switch (analysis_type) {
    case 'statistical':
      analysis = await performStatisticalAnalysis(data);
      break;
    case 'semantic':
      analysis = await performSemanticAnalysis(data);
      break;
    case 'trend':
      analysis = await performTrendAnalysis(data);
      break;
    case 'comparative':
      analysis = await performComparativeAnalysis(data);
      break;
  }
  
  // Format output
  const formatted = await formatAnalysis(analysis, format);
  
  return {
    analysis_type,
    input_summary: data.substring(0, 200) + '...',
    results: formatted,
    confidence_score: analysis.confidence || 0.8,
    recommendations: analysis.recommendations || [],
    timestamp: new Date().toISOString()
  };
}`
  }

  const generateValidationImplementation = (domain: string) => {
    return `async function validateOutput({ content, criteria = [], domain = 'general' }) {
  const validationResults = [];
  
  // Default validation criteria based on domain
  const defaultCriteria = {
    general: ['accuracy', 'completeness', 'clarity'],
    biology: ['scientific_accuracy', 'methodology', 'citations', 'statistical_validity'],
    finance: ['data_accuracy', 'regulatory_compliance', 'risk_assessment'],
    research: ['methodology', 'citations', 'reproducibility', 'peer_review_readiness']
  };
  
  const allCriteria = [...new Set([...(defaultCriteria[domain] || defaultCriteria.general), ...criteria])];
  
  for (const criterion of allCriteria) {
    const result = await validateAgainstCriterion(content, criterion, domain);
    validationResults.push(result);
  }
  
  const overallScore = validationResults.reduce((sum, r) => sum + r.score, 0) / validationResults.length;
  const passed = overallScore >= 0.7;
  
  return {
    passed,
    overall_score: overallScore,
    criteria_results: validationResults,
    recommendations: validationResults
      .filter(r => !r.passed)
      .map(r => r.recommendation)
      .filter(Boolean),
    validated_at: new Date().toISOString()
  };
}`
  }

  const generateWorkflowImplementation = (workflow: Partial<WorkflowDefinition>) => {
    return `async function executeWorkflow({ input, options = {} }) {
  const {
    model = '${workflow.targetModel?.name || 'claude-3.5-sonnet'}',
    complexity = '${workflow.complexity || 'medium'}',
    validation_level = 'standard'
  } = options;
  
  const workflowSteps = ${JSON.stringify(workflow.steps || [], null, 2)};
  const agents = ${JSON.stringify(workflow.agents || [], null, 2)};
  
  const executionResults = [];
  let currentInput = input;
  
  // Execute workflow steps in sequence
  for (const step of workflowSteps) {
    const agent = agents.find(a => a.id === step.agent_id);
    
    try {
      const stepResult = await executeStep(step, agent, currentInput, model);
      executionResults.push({
        step_id: step.id,
        step_name: step.name,
        status: 'completed',
        result: stepResult,
        timestamp: new Date().toISOString()
      });
      
      // Use output as input for next step
      currentInput = stepResult.output || currentInput;
      
      // Validate if required
      if (validation_level !== 'basic') {
        const validation = await validateStepOutput(stepResult, step, validation_level);
        executionResults[executionResults.length - 1].validation = validation;
        
        if (!validation.passed && validation_level === 'comprehensive') {
          throw new Error(\`Step validation failed: \${validation.issues.join(', ')}\`);
        }
      }
      
    } catch (error) {
      executionResults.push({
        step_id: step.id,
        step_name: step.name,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Handle error according to step configuration
      if (step.retry_config.max_retries > 0) {
        // Implement retry logic
      } else {
        break; // Stop execution on failure
      }
    }
  }
  
  const completedSteps = executionResults.filter(r => r.status === 'completed');
  const failedSteps = executionResults.filter(r => r.status === 'failed');
  
  return {
    workflow_id: '${workflow.id || 'generated'}',
    input,
    options,
    execution_results: executionResults,
    summary: {
      total_steps: workflowSteps.length,
      completed_steps: completedSteps.length,
      failed_steps: failedSteps.length,
      success_rate: (completedSteps.length / workflowSteps.length) * 100
    },
    final_output: currentInput,
    executed_at: new Date().toISOString()
  };
}`
  }

  const generateCodeFiles = (config: MCPServerConfig, workflow: Partial<WorkflowDefinition>): GeneratedFile[] => {
    const files: GeneratedFile[] = []

    // Package.json
    const packageJson = {
      name: config.name,
      version: config.version,
      description: config.description,
      main: 'dist/index.js',
      type: 'module',
      scripts: {
        'build': 'tsc',
        'dev': 'tsx src/index.ts',
        'start': 'node dist/index.js'
      },
      dependencies: config.dependencies.reduce((deps, dep) => {
        deps[dep] = 'latest'
        return deps
      }, {} as Record<string, string>),
      devDependencies: {
        'typescript': '^5.0.0',
        'tsx': '^4.0.0',
        '@types/node': '^20.0.0'
      },
      keywords: ['mcp', 'ai', 'workflow', workflow.domain],
      author: 'AI Workflow Generator',
      license: 'MIT'
    }

    files.push({
      name: 'package.json',
      type: 'json',
      content: JSON.stringify(packageJson, null, 2),
      size: JSON.stringify(packageJson, null, 2).length
    })

    // Main TypeScript file
    const indexTs = generateMainServerFile(config, workflow)
    files.push({
      name: 'src/index.ts',
      type: 'typescript',
      content: indexTs,
      size: indexTs.length
    })

    // README
    const readme = generateReadme(config, workflow)
    files.push({
      name: 'README.md',
      type: 'markdown',
      content: readme,
      size: readme.length
    })

    // TypeScript config
    const tsConfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        outDir: 'dist',
        declaration: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    }

    files.push({
      name: 'tsconfig.json',
      type: 'json',
      content: JSON.stringify(tsConfig, null, 2),
      size: JSON.stringify(tsConfig, null, 2).length
    })

    return files
  }

  const generateMainServerFile = (config: MCPServerConfig, workflow: Partial<WorkflowDefinition>) => {
    return `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * ${config.description}
 * Generated for workflow: ${workflow.name || 'AI Workflow'}
 * Domain: ${workflow.domain || 'general'}
 * Complexity: ${workflow.complexity || 'medium'}
 */

class ${config.name.replace(/-/g, '').replace(/^\w/, c => c.toUpperCase())}Server {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: '${config.name}',
        version: '${config.version}',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          ${config.tools.map(tool => `{
            name: '${tool.name}',
            description: '${tool.description}',
            inputSchema: ${JSON.stringify(tool.input_schema, null, 12).replace(/^/gm, '          ')}
          }`).join(',\n          ')}
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          ${config.tools.map(tool => `case '${tool.name}':
            return await this.${tool.name.replace(/-/g, '_')}(args);`).join('\n          ')}
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              \`Unknown tool: \${name}\`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          \`Tool execution failed: \${error instanceof Error ? error.message : String(error)}\`
        );
      }
    });
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  ${config.tools.map(tool => `
  /**
   * ${tool.description}
   */
  private async ${tool.name.replace(/-/g, '_')}(args: any) {
    ${tool.implementation.split('\n').map(line => '    ' + line).join('\n')}
  }`).join('')}

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('${config.name} MCP server running on stdio');
  }
}

const server = new ${config.name.replace(/-/g, '').replace(/^\w/, c => c.toUpperCase())}Server();
server.run().catch(console.error);`
  }

  const generateReadme = (config: MCPServerConfig, workflow: Partial<WorkflowDefinition>) => {
    return `# ${config.name}

${config.description}

## Overview

This MCP server was automatically generated for an AI workflow with the following specifications:

- **Domain**: ${workflow.domain || 'General'}
- **Complexity**: ${workflow.complexity || 'Medium'}
- **Agents**: ${workflow.agents?.length || 0}
- **Steps**: ${workflow.steps?.length || 0}

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Usage

### With Claude Desktop

Add to your \`claude_desktop_config.json\`:

\`\`\`json
{
  "mcpServers": {
    "${config.name}": {
      "command": "node",
      "args": ["path/to/${config.name}/dist/index.js"],
      "env": {
        ${Object.entries(config.environment_variables).map(([key, value]) => `"${key}": "${value}"`).join(',\n        ')}
      }
    }
  }
}
\`\`\`

### Available Tools

${config.tools.map(tool => `
#### \`${tool.name}\`

${tool.description}

**Parameters:**
${JSON.stringify(tool.input_schema, null, 2)}
`).join('')}

## Environment Variables

${Object.entries(config.environment_variables).map(([key, value]) => `- **${key}**: ${value}`).join('\n')}

## Development

\`\`\`bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
\`\`\`

## Generated Workflow

This server implements the following workflow:

${workflow.steps?.map((step, i) => `${i + 1}. **${step.name}**: ${step.description}`).join('\n') || 'No steps defined'}

## License

MIT
`
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyFeedback(`${type} copied to clipboard!`)
      setTimeout(() => setCopyFeedback(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setCopyFeedback('Failed to copy')
      setTimeout(() => setCopyFeedback(null), 2000)
    }
  }

  const handleDownload = () => {
    if (generatedConfig && onDownload) {
      onDownload(generatedConfig)
    }
  }

  const handleDeploy = () => {
    if (generatedConfig && onDeploy) {
      onDeploy(generatedConfig)
    }
  }

  if (!generatedConfig) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Generating MCP server configuration...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            Generated MCP Server
          </h3>
          <p className="text-gray-400">Ready-to-deploy Model Context Protocol server</p>
        </div>
        
        <div className="flex items-center gap-3">
          {onDownload && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
          {onDeploy && (
            <button
              onClick={handleDeploy}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              Deploy
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-700 p-1 rounded-lg mb-6">
        {[
          { id: 'overview', label: 'Overview', icon: Server },
          { id: 'tools', label: 'Tools', icon: Zap },
          { id: 'code', label: 'Generated Code', icon: Code },
          { id: 'deployment', label: 'Deployment', icon: Globe }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-gray-300"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Copy Feedback */}
      {copyFeedback && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {copyFeedback}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Server Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Server Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white font-mono">{generatedConfig.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Version:</span>
                  <span className="text-white">{generatedConfig.version}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Runtime:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{runtimeInfo[generatedConfig.runtime]?.icon}</span>
                    <span className={cn("font-medium", runtimeInfo[generatedConfig.runtime]?.color)}>
                      {runtimeInfo[generatedConfig.runtime]?.name}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tools:</span>
                  <span className="text-white">{generatedConfig.tools.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dependencies:</span>
                  <span className="text-white">{generatedConfig.dependencies.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Workflow Mapping</h4>
              <div className="space-y-3">
                {workflow.agents?.map(agent => (
                  <div key={agent.id} className="flex items-center gap-3 p-2 bg-gray-600 rounded">
                    <div className={cn("w-2 h-2 rounded-full", getAgentColor(agent.role).split(' ')[0])} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{agent.name}</div>
                      <div className="text-xs text-gray-400 capitalize">{agent.role}</div>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white">Quick Start</h4>
              <button
                onClick={() => copyToClipboard(`git clone ${generatedConfig.name}\ncd ${generatedConfig.name}\nnpm install\nnpm run build\nnpm start`, 'Installation commands')}
                className="text-gray-400 hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <pre className="bg-gray-800 rounded p-3 text-sm text-gray-300 overflow-x-auto">
{`# Install dependencies
npm install

# Build the server
npm run build

# Start the server
npm start`}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'tools' && (
        <div className="space-y-4">
          {generatedConfig.tools.map((tool, index) => (
            <div key={tool.name} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white font-mono">{tool.name}</h4>
                    <p className="text-sm text-gray-400">{tool.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(tool, null, 2), 'Tool definition')}
                  className="text-gray-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Input Schema</h5>
                  <pre className="bg-gray-800 rounded p-3 text-sm text-gray-300 overflow-x-auto">
                    {JSON.stringify(tool.input_schema, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'code' && (
        <div className="space-y-4">
          {generatedFiles.map((file, index) => (
            <div key={file.name} className="bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between p-4 border-b border-gray-600">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-white font-mono">{file.name}</span>
                  <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  onClick={() => copyToClipboard(file.content, `${file.name} content`)}
                  className="text-gray-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <pre className="p-4 text-sm text-gray-300 overflow-x-auto max-h-64">
                {file.content}
              </pre>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'deployment' && (
        <div className="space-y-6">
          {/* Claude Desktop Integration */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-400" />
                Claude Desktop Configuration
              </h4>
              <button
                onClick={() => copyToClipboard(JSON.stringify({
                  mcpServers: {
                    [generatedConfig.name]: {
                      command: 'node',
                      args: [`path/to/${generatedConfig.name}/dist/index.js`],
                      env: generatedConfig.environment_variables
                    }
                  }
                }, null, 2), 'Claude Desktop config')}
                className="text-gray-400 hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Add this configuration to your <code className="bg-gray-800 px-1 rounded">claude_desktop_config.json</code> file:
            </p>
            <pre className="bg-gray-800 rounded p-3 text-sm text-gray-300 overflow-x-auto">
{JSON.stringify({
  mcpServers: {
    [generatedConfig.name]: {
      command: 'node',
      args: [`path/to/${generatedConfig.name}/dist/index.js`],
      env: generatedConfig.environment_variables
    }
  }
}, null, 2)}
            </pre>
          </div>

          {/* Environment Variables */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-white mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-green-400" />
              Required Environment Variables
            </h4>
            <div className="space-y-2">
              {Object.entries(generatedConfig.environment_variables).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-600 rounded">
                  <code className="text-sm font-mono text-gray-300">{key}</code>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-gray-400">{value}</code>
                    {key.includes('API_KEY') && (
                      <AlertCircle className="w-4 h-4 text-orange-400" title="API Key required" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deployment Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-white mb-2 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                Local Development
              </h5>
              <p className="text-sm text-gray-400 mb-3">Run the server locally for testing and development.</p>
              <pre className="bg-gray-800 rounded p-2 text-xs text-gray-300">
{`npm run dev`}
              </pre>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-white mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-green-400" />
                Production Deploy
              </h5>
              <p className="text-sm text-gray-400 mb-3">Deploy to a server or cloud platform.</p>
              <pre className="bg-gray-800 rounded p-2 text-xs text-gray-300">
{`npm run build
npm start`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const getAgentColor = (role: string) => {
  const colors = {
    researcher: 'bg-blue-500',
    analyzer: 'bg-purple-500',
    validator: 'bg-green-500',
    antagonist: 'bg-red-500',
    synthesizer: 'bg-orange-500',
    coordinator: 'bg-indigo-500',
    specialist: 'bg-teal-500'
  }
  return colors[role as keyof typeof colors] || 'bg-gray-500'
}