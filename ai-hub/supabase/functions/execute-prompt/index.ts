import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PromptExecution {
  templateId?: string
  chainId?: string
  variables: Record<string, any>
  aiModel: string
}

interface AIProvider {
  execute(prompt: string, model: string): Promise<{
    response: string
    usage: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    }
  }>
}

class OpenAIProvider implements AIProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async execute(prompt: string, model: string = 'gpt-4') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return {
      response: data.choices[0].message.content,
      usage: data.usage,
    }
  }
}

class ClaudeProvider implements AIProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async execute(prompt: string, model: string = 'claude-3-sonnet-20240229') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return {
      response: data.content[0].text,
      usage: {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    }
  }
}

function replaceVariables(template: string, variables: Record<string, any>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    result = result.replace(regex, String(value))
  }
  return result
}

function extractReasoningData(response: string): any {
  // Extract structured reasoning data from AI response
  const reasoningPatterns = {
    decisions: /(?:decisions?|conclusions?):\s*\n(.*?)(?:\n\n|\n[A-Z])/gis,
    questions: /(?:questions?|inquiries?):\s*\n(.*?)(?:\n\n|\n[A-Z])/gis,
    reasoning: /(?:reasoning|analysis|rationale):\s*\n(.*?)(?:\n\n|\n[A-Z])/gis,
    next_steps: /(?:next steps?|follow.?up|recommendations?):\s*\n(.*?)(?:\n\n|\n[A-Z])/gis,
  }

  const extracted: any = {}
  for (const [key, pattern] of Object.entries(reasoningPatterns)) {
    const matches = [...response.matchAll(pattern)]
    if (matches.length > 0) {
      extracted[key] = matches.map(match => match[1].trim())
    }
  }

  return extracted
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const jwt = authHeader.replace('Bearer ', '')
    const { data: userData } = await supabase.auth.getUser(jwt)
    const userId = userData.user?.id

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { templateId, chainId, variables, aiModel }: PromptExecution = await req.json()

    let template: any = null
    let chain: any = null
    let finalPrompt: string = ''

    // Get template or chain
    if (templateId) {
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error || !data) {
        return new Response(JSON.stringify({ error: 'Template not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      template = data
      finalPrompt = replaceVariables(template.template, variables)
    } else if (chainId) {
      const { data, error } = await supabase
        .from('prompt_chains')
        .select('*')
        .eq('id', chainId)
        .single()

      if (error || !data) {
        return new Response(JSON.stringify({ error: 'Chain not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      chain = data
      // For chains, we'll process the first step initially
      const firstStep = chain.chain_config.steps[0]
      finalPrompt = replaceVariables(firstStep.template, variables)
    }

    // Create execution record
    const executionData = {
      user_id: userId,
      prompt_template_id: templateId || null,
      prompt_chain_id: chainId || null,
      input_variables: variables,
      final_prompt: finalPrompt,
      ai_model: aiModel,
      status: 'pending',
    }

    const { data: execution, error: execError } = await supabase
      .from('prompt_executions')
      .insert(executionData)
      .select()
      .single()

    if (execError) {
      return new Response(JSON.stringify({ error: 'Failed to create execution' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Execute AI request
    const startTime = Date.now()
    let provider: AIProvider

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    const claudeKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (aiModel.startsWith('gpt-')) {
      if (!openaiKey) {
        throw new Error('OpenAI API key not configured')
      }
      provider = new OpenAIProvider(openaiKey)
    } else if (aiModel.startsWith('claude-')) {
      if (!claudeKey) {
        throw new Error('Claude API key not configured')
      }
      provider = new ClaudeProvider(claudeKey)
    } else {
      throw new Error(`Unsupported AI model: ${aiModel}`)
    }

    const result = await provider.execute(finalPrompt, aiModel)
    const executionTime = Date.now() - startTime

    // Extract reasoning data
    const reasoningData = extractReasoningData(result.response)

    // Update execution record
    await supabase
      .from('prompt_executions')
      .update({
        response_data: {
          response: result.response,
          reasoning: reasoningData,
        },
        execution_time: executionTime,
        token_usage: result.usage,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', execution.id)

    // Store result for chains
    if (chainId) {
      await supabase
        .from('prompt_results')
        .insert({
          execution_id: execution.id,
          step_number: 1,
          step_name: chain?.chain_config.steps[0]?.name || 'Step 1',
          prompt_text: finalPrompt,
          response_text: result.response,
          reasoning_data: reasoningData,
          confidence_score: reasoningData.confidence || null,
          processing_time: executionTime,
        })
    }

    return new Response(
      JSON.stringify({
        execution_id: execution.id,
        response: result.response,
        reasoning: reasoningData,
        execution_time: executionTime,
        token_usage: result.usage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Prompt execution error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})