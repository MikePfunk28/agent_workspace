import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  preferences?: any
  subscription_tier?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  github_url?: string
  status: string
  technologies: string[]
  metrics: any
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface KnowledgeItem {
  id: string
  user_id: string
  title: string
  content?: string
  source_url?: string
  item_type: 'paper' | 'article' | 'prompt' | 'template' | 'note'
  tags: string[]
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface AIContent {
  id: string
  title: string
  content?: string
  summary?: string
  url?: string
  source: string
  content_type: 'news' | 'paper' | 'blog' | 'tutorial'
  authors: string[]
  published_at?: string
  relevance_score?: number
  created_at: string
}

export interface StockData {
  id: string
  symbol: string
  company_name?: string
  price: number
  change_percent: number
  volume?: number
  market_cap?: number
  sector: string
  is_ai_related: boolean
  timestamp: string
}

export interface Hackathon {
  id: string
  name: string
  description?: string
  url?: string
  platform: string
  start_date?: string
  end_date?: string
  prize_amount?: number
  location?: string
  is_virtual: boolean
  tags: string[]
  created_at: string
}

export interface Newsletter {
  id: string
  user_id: string
  type: 'daily' | 'weekly'
  title: string
  content: string
  generated_at: string
  sent_at?: string
  is_personalized: boolean
}