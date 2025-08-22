import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface EmbeddingRequest {
  contentId: string
  contentType: 'ai_content' | 'knowledge_items' | 'hackathons'
  title: string
  content?: string
  metadata?: Record<string, any>
  forceRegenerate?: boolean
}

interface EmbeddingResponse {
  success: boolean
  embeddingId?: string
  error?: string
}

async function generateEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text.substring(0, 8000), // Limit to ~8k chars to stay within token limits
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

function prepareTextForEmbedding(title: string, content?: string, metadata?: Record<string, any>): string {
  let text = title

  if (content) {
    // Clean and prepare content
    const cleanContent = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    text += '\n\n' + cleanContent
  }

  // Add metadata context if available
  if (metadata) {
    if (metadata.authors && Array.isArray(metadata.authors)) {
      text += '\n\nAuthors: ' + metadata.authors.join(', ')
    }
    if (metadata.tags && Array.isArray(metadata.tags)) {
      text += '\n\nTags: ' + metadata.tags.join(', ')
    }
    if (metadata.source) {
      text += '\n\nSource: ' + metadata.source
    }
  }

  return text.substring(0, 8000) // Ensure we don't exceed token limits
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration not found')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    if (req.method === 'POST') {
      const body: EmbeddingRequest = await req.json()
      
      if (!body.contentId || !body.contentType || !body.title) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required fields: contentId, contentType, title' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if embedding already exists (unless force regenerate)
      if (!body.forceRegenerate) {
        const { data: existingEmbedding } = await supabase
          .from('content_embeddings')
          .select('id')
          .eq('content_id', body.contentId)
          .eq('content_type', body.contentType)
          .single()

        if (existingEmbedding) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              embeddingId: existingEmbedding.id,
              message: 'Embedding already exists' 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Prepare text for embedding
      const textToEmbed = prepareTextForEmbedding(body.title, body.content, body.metadata)
      
      // Generate embedding
      const embedding = await generateEmbedding(textToEmbed)

      // Store embedding in database
      const { data: embeddingData, error: embeddingError } = await supabase
        .from('content_embeddings')
        .upsert({
          content_id: body.contentId,
          content_type: body.contentType,
          title: body.title,
          content_text: body.content,
          embedding,
          metadata: body.metadata || {}
        }, {
          onConflict: 'content_id,content_type'
        })
        .select('id')
        .single()

      if (embeddingError) {
        console.error('Database error:', embeddingError)
        throw new Error(`Failed to store embedding: ${embeddingError.message}`)
      }

      const response: EmbeddingResponse = {
        success: true,
        embeddingId: embeddingData.id
      }

      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (req.method === 'GET') {
      // Health check endpoint
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Embedding generation service is running',
          hasOpenAIKey: !!OPENAI_API_KEY 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error in generate-embeddings function:', error)
    
    const errorResponse: EmbeddingResponse = {
      success: false,
      error: error.message || 'Internal server error'
    }

    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/* 
Usage examples:

1. Generate embedding for AI content:
POST /functions/v1/generate-embeddings
{
  "contentId": "123e4567-e89b-12d3-a456-426614174000",
  "contentType": "ai_content",
  "title": "Advanced Neural Networks",
  "content": "This paper discusses...",
  "metadata": {
    "authors": ["John Doe", "Jane Smith"],
    "source": "arXiv",
    "tags": ["neural networks", "deep learning"]
  }
}

2. Generate embedding for knowledge item:
POST /functions/v1/generate-embeddings
{
  "contentId": "456e7890-e89b-12d3-a456-426614174001",
  "contentType": "knowledge_items", 
  "title": "React Best Practices",
  "content": "Here are some tips...",
  "metadata": {
    "tags": ["react", "javascript", "frontend"]
  }
}

3. Force regenerate existing embedding:
POST /functions/v1/generate-embeddings
{
  "contentId": "123e4567-e89b-12d3-a456-426614174000",
  "contentType": "ai_content",
  "title": "Advanced Neural Networks",
  "content": "Updated content...",
  "forceRegenerate": true
}

4. Health check:
GET /functions/v1/generate-embeddings
*/