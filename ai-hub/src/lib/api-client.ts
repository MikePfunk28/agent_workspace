import { supabase } from './supabase'

export interface ApiError {
  message: string
  status?: number
  details?: any
}

export interface SupabaseFunctionConfig {
  functionName: string
  body?: any
  headers?: Record<string, string>
  retryAttempts?: number
  retryDelay?: number
}

/**
 * Enhanced Supabase Edge Function client with error handling and retries
 */
export class SupabaseApiClient {
  private static instance: SupabaseApiClient
  private baseUrl: string

  private constructor() {
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bwwpfikcrwhgahosahou.supabase.co'
  }

  public static getInstance(): SupabaseApiClient {
    if (!SupabaseApiClient.instance) {
      SupabaseApiClient.instance = new SupabaseApiClient()
    }
    return SupabaseApiClient.instance
  }

  /**
   * Call a Supabase Edge Function with enhanced error handling
   */
  async callFunction({
    functionName,
    body,
    headers = {},
    retryAttempts = 2,
    retryDelay = 1000
  }: SupabaseFunctionConfig): Promise<any> {
    const functionUrl = `${this.baseUrl}/functions/v1/${functionName}`

    // Get authentication token
    const { data: session } = await supabase.auth.getSession()
    if (!session?.session?.access_token) {
      throw new Error('Authentication required. Please log in again.')
    }

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      ...headers
    }

    let lastError: Error

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        console.log(`Calling ${functionName} (attempt ${attempt + 1}/${retryAttempts + 1})`)

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: defaultHeaders,
          body: body ? JSON.stringify(body) : undefined
        })

        // Handle non-2xx responses
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`

          try {
            const errorData = await response.json()
            if (errorData.error) {
              errorMessage = errorData.error
            }
          } catch (parseError) {
            // If we can't parse the error response, use the status text
            console.warn('Could not parse error response:', parseError)
          }

          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(errorMessage)
          }

          // Retry on server errors (5xx) or network issues
          if (attempt === retryAttempts) {
            throw new Error(errorMessage)
          }

          lastError = new Error(errorMessage)
          continue
        }

        // Parse successful response
        const data = await response.json()
        console.log(`Successfully called ${functionName}`)
        return data

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Don't retry on authentication errors or client errors
        if (lastError.message.includes('Authentication') ||
            lastError.message.includes('401') ||
            lastError.message.includes('403') ||
            attempt === retryAttempts) {
          throw lastError
        }

        // Wait before retrying
        if (attempt < retryAttempts) {
          console.warn(`Attempt ${attempt + 1} failed, retrying in ${retryDelay}ms:`, lastError.message)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          retryDelay *= 2 // Exponential backoff
        }
      }
    }

    throw lastError || new Error(`Failed to call ${functionName} after ${retryAttempts + 1} attempts`)
  }

  /**
   * Test connection to a Supabase function
   */
  async testFunctionConnection(functionName: string): Promise<boolean> {
    try {
      await this.callFunction({
        functionName,
        body: { test: true },
        retryAttempts: 0
      })
      return true
    } catch (error) {
      console.error(`Connection test failed for ${functionName}:`, error)
      return false
    }
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error
    }

    if (error?.message) {
      // Handle specific error types
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return 'Network connection failed. Please check your internet connection and try again.'
      }

      if (error.message.includes('401') || error.message.includes('Authentication')) {
        return 'Your session has expired. Please log in again.'
      }

      if (error.message.includes('403')) {
        return 'You don\'t have permission to perform this action.'
      }

      if (error.message.includes('404')) {
        return 'The requested function was not found. Please contact support.'
      }

      if (error.message.includes('500')) {
        return 'Server error occurred. Please try again later.'
      }

      return error.message
    }

    return 'An unexpected error occurred. Please try again.'
  }
}

// Export singleton instance
export const apiClient = SupabaseApiClient.getInstance()

// Convenience function for common API calls
export const callSupabaseFunction = (config: SupabaseFunctionConfig) =>
  apiClient.callFunction(config)

export const testFunctionConnection = (functionName: string) =>
  apiClient.testFunctionConnection(functionName)

export const getApiErrorMessage = (error: any) =>
  apiClient.getErrorMessage(error)
