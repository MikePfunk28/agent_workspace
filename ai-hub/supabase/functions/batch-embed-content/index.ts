import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface BatchEmbedRequest {
  contentType?: 'ai_content' | 'knowledge_items' | 'all'
  batchSize?: number
  skipExisting?: boolean
  onlyMissingEmbeddings?: boolean
}

interface BatchProgress {
  totalItems: number
  processed: number
  successful: number
  failed: number
  currentBatch: number
  errors: string[]
}

interface BatchEmbedResponse {
  success: boolean
  progress?: BatchProgress
  message?: string
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
      input: text.substring(0, 8000), // Stay within token limits
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

function prepareTextForEmbedding(title: string, content?: string, summary?: string, authors?: string[]): string {
  let text = title

  if (summary) {
    text += '\n\n' + summary
  }

  if (content) {
    const cleanContent = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    text += '\n\n' + cleanContent
  }

  if (authors && authors.length > 0) {
    text += '\n\nAuthors: ' + authors.join(', ')
  }

  return text.substring(0, 8000) // Ensure we don't exceed token limits
}

async function getContentToProcess(
  supabase: any,
  contentType: string,
  skipExisting: boolean,
  limit: number,
  offset: number
) {
  if (contentType === 'ai_content') {
    let query = supabase
      .from('ai_content')
      .select('id, title, content, summary, authors, source, content_type')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (skipExisting) {
      // Only get content that doesn't have embeddings
      const { data: existingEmbeddings } = await supabase
        .from('content_embeddings')
        .select('content_id')
        .eq('content_type', 'ai_content')

      const existingIds = existingEmbeddings?.map((e: any) => e.content_id) || []
      if (existingIds.length > 0) {
        query = query.not('id', 'in', `(${existingIds.map(id => `'${id}'`).join(',')})`)
      }
    }

    return await query
  } 
  else if (contentType === 'knowledge_items') {
    let query = supabase
      .from('knowledge_items')
      .select('id, title, content, tags, item_type')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (skipExisting) {
      const { data: existingEmbeddings } = await supabase
        .from('content_embeddings')
        .select('content_id')
        .eq('content_type', 'knowledge_items')

      const existingIds = existingEmbeddings?.map((e: any) => e.content_id) || []
      if (existingIds.length > 0) {
        query = query.not('id', 'in', `(${existingIds.map(id => `'${id}'`).join(',')})`)
      }
    }

    return await query
  }

  throw new Error('Unsupported content type')
}

async function processContentBatch(
  supabase: any,
  contentItems: any[],
  contentType: string
): Promise<{ successful: number; failed: number; errors: string[] }> {
  let successful = 0
  let failed = 0
  const errors: string[] = []

  for (const item of contentItems) {
    try {
      let textToEmbed: string
      let metadata: Record<string, any>

      if (contentType === 'ai_content') {
        textToEmbed = prepareTextForEmbedding(
          item.title,
          item.content,
          item.summary,
          item.authors
        )
        metadata = {
          authors: item.authors || [],
          source: item.source,
          content_type: item.content_type,
          url: item.url
        }
      } else if (contentType === 'knowledge_items') {
        textToEmbed = prepareTextForEmbedding(
          item.title,
          item.content
        )
        metadata = {
          tags: item.tags || [],
          item_type: item.item_type
        }
      } else {
        throw new Error(`Unsupported content type: ${contentType}`)
      }

      // Generate embedding
      const embedding = await generateEmbedding(textToEmbed)

      // Store embedding
      const { error: embeddingError } = await supabase
        .from('content_embeddings')
        .upsert({
          content_id: item.id,
          content_type: contentType,
          title: item.title,
          content_text: item.content,
          embedding,
          metadata
        }, {
          onConflict: 'content_id,content_type'
        })

      if (embeddingError) {
        throw embeddingError
      }

      successful++
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      failed++
      const errorMsg = `Failed to process ${contentType} ${item.id}: ${error.message}`
      errors.push(errorMsg)
      console.error(errorMsg, error)
    }
  }

  return { successful, failed, errors }
}

async function getContentCount(supabase: any, contentType: string, skipExisting: boolean): Promise<number> {
  if (contentType === 'ai_content') {
    let query = supabase
      .from('ai_content')
      .select('id', { count: 'exact', head: true })

    if (skipExisting) {
      const { data: existingEmbeddings } = await supabase
        .from('content_embeddings')
        .select('content_id')
        .eq('content_type', 'ai_content')

      const existingIds = existingEmbeddings?.map((e: any) => e.content_id) || []
      if (existingIds.length > 0) {
        query = query.not('id', 'in', `(${existingIds.map(id => `'${id}'`).join(',')})`)
      }
    }

    const { count, error } = await query
    if (error) throw error
    return count || 0
  } 
  else if (contentType === 'knowledge_items') {
    let query = supabase
      .from('knowledge_items')
      .select('id', { count: 'exact', head: true })

    if (skipExisting) {
      const { data: existingEmbeddings } = await supabase
        .from('content_embeddings')
        .select('content_id')
        .eq('content_type', 'knowledge_items')

      const existingIds = existingEmbeddings?.map((e: any) => e.content_id) || []
      if (existingIds.length > 0) {
        query = query.not('id', 'in', `(${existingIds.map(id => `'${id}'`).join(',')})`)
      }
    }

    const { count, error } = await query
    if (error) throw error
    return count || 0
  }

  return 0
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

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    if (req.method === 'GET') {
      // Status endpoint - get embedding statistics
      const { data: embeddingStats, error: statsError } = await supabase
        .from('content_embeddings')
        .select('content_type')

      if (statsError) throw statsError

      const stats = embeddingStats.reduce((acc: any, row: any) => {
        acc[row.content_type] = (acc[row.content_type] || 0) + 1
        return acc
      }, {})

      // Get total content counts
      const aiContentCount = await getContentCount(supabase, 'ai_content', false)
      const knowledgeItemsCount = await getContentCount(supabase, 'knowledge_items', false)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Batch embedding service is running',
          statistics: {
            totalEmbeddings: embeddingStats.length,
            embeddingsByType: stats,
            totalContent: {
              ai_content: aiContentCount,
              knowledge_items: knowledgeItemsCount
            },
            coverage: {
              ai_content: aiContentCount > 0 ? ((stats.ai_content || 0) / aiContentCount * 100).toFixed(1) + '%' : '0%',
              knowledge_items: knowledgeItemsCount > 0 ? ((stats.knowledge_items || 0) / knowledgeItemsCount * 100).toFixed(1) + '%' : '0%'
            }
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: BatchEmbedRequest = await req.json()
    
    const contentType = body.contentType || 'all'
    const batchSize = Math.min(body.batchSize || 10, 50) // Max 50 items per batch
    const skipExisting = body.skipExisting !== false // Default to true
    
    const contentTypes = contentType === 'all' 
      ? ['ai_content', 'knowledge_items'] 
      : [contentType]

    const progress: BatchProgress = {
      totalItems: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      currentBatch: 0,
      errors: []
    }

    // Calculate total items
    for (const type of contentTypes) {
      const count = await getContentCount(supabase, type, skipExisting)
      progress.totalItems += count
    }

    if (progress.totalItems === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: skipExisting 
            ? 'No content found that needs embeddings'
            : 'No content found to process',
          progress
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process content in batches
    for (const type of contentTypes) {
      let offset = 0
      let hasMore = true

      while (hasMore) {
        progress.currentBatch++

        const { data: contentItems, error } = await getContentToProcess(
          supabase,
          type,
          skipExisting,
          batchSize,
          offset
        )

        if (error) {
          progress.errors.push(`Error fetching ${type}: ${error.message}`)
          break
        }

        if (!contentItems || contentItems.length === 0) {
          hasMore = false
          break
        }

        const batchResult = await processContentBatch(supabase, contentItems, type)
        
        progress.processed += contentItems.length
        progress.successful += batchResult.successful
        progress.failed += batchResult.failed
        progress.errors.push(...batchResult.errors)

        offset += batchSize

        // If we processed fewer items than batch size, we're done
        if (contentItems.length < batchSize) {
          hasMore = false
        }

        // Add delay between batches to avoid overwhelming the API
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    const response: BatchEmbedResponse = {
      success: true,
      progress,
      message: `Batch processing completed. ${progress.successful}/${progress.processed} items processed successfully.`
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in batch-embed-content function:', error)
    
    const errorResponse: BatchEmbedResponse = {
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

1. Process all content, skip existing embeddings:
POST /functions/v1/batch-embed-content
{
  "contentType": "all",
  "batchSize": 20,
  "skipExisting": true
}

2. Process only AI content, overwrite existing:
POST /functions/v1/batch-embed-content
{
  "contentType": "ai_content",
  "batchSize": 10,
  "skipExisting": false
}

3. Process only knowledge items:
POST /functions/v1/batch-embed-content
{
  "contentType": "knowledge_items",
  "batchSize": 15
}

4. Get embedding statistics:
GET /functions/v1/batch-embed-content
*/