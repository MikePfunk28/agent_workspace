import { supabase } from '../lib/supabase'
import type { User, Project, KnowledgeItem, AIContent, StockData, Hackathon, Newsletter } from '../lib/supabase'

// User Profile Operations
export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function updateUserProfile(userId: string, updates: any) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
  return { data, error }
}

// Project Operations
export async function fetchUserProjects(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  return { data, error }
}

export async function createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single()
  return { data, error }
}

// Knowledge Item Operations
export async function fetchUserKnowledgeItems(userId: string) {
  const { data, error } = await supabase
    .from('knowledge_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

// Prompt Template Operations
export async function fetchPromptTemplates(userId?: string) {
  let query = supabase
    .from('prompt_templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.or(`is_public.eq.true,user_id.eq.${userId}`)
  } else {
    query = query.eq('is_public', true)
  }

  const { data, error } = await query
  return { data, error }
}

export async function createPromptTemplate(template: any) {
  const { data, error } = await supabase
    .from('prompt_templates')
    .insert([template])
    .select()
    .single()
  return { data, error }
}

// Hackathon Operations
export async function fetchHackathons() {
  const { data, error } = await supabase
    .from('hackathons')
    .select('*')
    .order('start_date', { ascending: false })
  return { data, error }
}

// AI Content Operations
export async function fetchAIContent(limit = 10) {
  const { data, error } = await supabase
    .from('ai_content')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data, error }
}

// Stock Data Operations
export async function fetchStockData() {
  const { data, error } = await supabase
    .from('stock_data')
    .select('*')
    .order('timestamp', { ascending: false })
  return { data, error }
}

// Newsletter Operations
export async function fetchUserNewsletters(userId: string) {
  const { data, error } = await supabase
    .from('newsletters')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
  return { data, error }
}

// Todos Operations (for testing connectivity)
export async function fetchTodos() {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('inserted_at', { ascending: false })
  return { data, error }
}

export async function createTodo(todo: { title: string, user_id?: string }) {
  const { data, error } = await supabase
    .from('todos')
    .insert([todo])
    .select()
    .single()
  return { data, error }
}