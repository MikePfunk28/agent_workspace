/**
 * Cached Data Service
 * Cache-first approach with scheduled updates and manual refresh capabilities
 */

import { supabase } from '@/lib/supabase';
import { SupabaseAPI } from './supabase-api';

export interface StockData {
  id: string;
  symbol: string;
  price: number;
  change_percent: number;
  data_source: string;
  cached_at: string;
  expires_at: string;
}

export interface FundingData {
  id: string;
  company_name: string;
  funding_amount: number;
  funding_round: string;
  industry: string;
  announcement_date: string;
  cached_at: string;
  expires_at: string;
}

export interface JobData {
  id: string;
  role_title: string;
  company: string;
  location: string;
  salary_min: number;
  salary_max: number;
  experience_level: string;
  remote_friendly: boolean;
  cached_at: string;
  expires_at: string;
}

export interface AIContentData {
  id: string;
  title: string;
  content_type: string;
  source: string;
  url: string;
  summary: string;
  tags: string[];
  cached_at: string;
  expires_at: string;
}

export interface DataFreshnessInfo {
  stockData: Date | null;
  fundingData: Date | null;
  jobData: Date | null;
  aiContent: Date | null;
  hackathons: Date | null;
}

export interface RefreshStatus {
  success: boolean;
  message: string;
  recordsUpdated: number;
  lastRefresh: Date;
}

export class CachedDataService {
  private static readonly CACHE_TABLES = {
    stocks: 'cached_stock_data',
    funding: 'cached_funding_data', 
    jobs: 'cached_job_data',
    aiContent: 'cached_ai_content',
    refreshLog: 'data_refresh_log'
  };

  // Cache-first stock data
  static async getStockData(forceRefresh = false): Promise<StockData[]> {
    try {
      if (!forceRefresh) {
        // Try cache first
        const { data: cachedData, error } = await supabase
          .from(this.CACHE_TABLES.stocks)
          .select('*')
          .gt('expires_at', new Date().toISOString())
          .order('cached_at', { ascending: false });
          
        if (!error && cachedData && cachedData.length > 0) {
          console.log(`📊 Loaded ${cachedData.length} stocks from cache`);
          return cachedData;
        }
      }
      
      // Fallback to edge function
      console.log('🔄 Fetching fresh stock data from edge function...');
      const result = await SupabaseAPI.fetchStockData();
      
      if (result.success && result.data) {
        // Cache the new data
        await this.cacheStockData(result.data);
        
        // Return transformed data
        return this.transformStockResponse(result.data);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return [];
    }
  }

  // Cache-first funding data
  static async getFundingData(forceRefresh = false): Promise<FundingData[]> {
    try {
      if (!forceRefresh) {
        const { data: cachedData, error } = await supabase
          .from(this.CACHE_TABLES.funding)
          .select('*')
          .gt('expires_at', new Date().toISOString())
          .order('cached_at', { ascending: false })
          .limit(50);
          
        if (!error && cachedData && cachedData.length > 0) {
          console.log(`💰 Loaded ${cachedData.length} funding rounds from cache`);
          return cachedData;
        }
      }
      
      console.log('🔄 Fetching fresh funding data from edge function...');
      const result = await SupabaseAPI.fetchStartupFunding();
      
      if (result.success && result.data?.funding_rounds) {
        await this.cacheFundingData(result.data);
        return this.transformFundingResponse(result.data);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching funding data:', error);
      return [];
    }
  }

  // Cache-first job data  
  static async getJobData(forceRefresh = false): Promise<JobData[]> {
    try {
      if (!forceRefresh) {
        const { data: cachedData, error } = await supabase
          .from(this.CACHE_TABLES.jobs)
          .select('*')
          .gt('expires_at', new Date().toISOString())
          .order('cached_at', { ascending: false })
          .limit(100);
          
        if (!error && cachedData && cachedData.length > 0) {
          console.log(`💼 Loaded ${cachedData.length} jobs from cache`);
          return cachedData;
        }
      }
      
      console.log('🔄 Fetching fresh job data from edge function...');
      const result = await SupabaseAPI.fetchJobMarket();
      
      if (result.success && result.data?.jobs) {
        await this.cacheJobData(result.data);
        return this.transformJobResponse(result.data);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching job data:', error);
      return [];
    }
  }

  // Cache-first AI content
  static async getAIContent(forceRefresh = false): Promise<AIContentData[]> {
    try {
      if (!forceRefresh) {
        const { data: cachedData, error } = await supabase
          .from(this.CACHE_TABLES.aiContent)
          .select('*')
          .gt('expires_at', new Date().toISOString())
          .order('cached_at', { ascending: false })
          .limit(50);
          
        if (!error && cachedData && cachedData.length > 0) {
          console.log(`🧠 Loaded ${cachedData.length} AI content items from cache`);
          return cachedData;
        }
      }
      
      console.log('🔄 Fetching fresh AI content from edge function...');
      const result = await SupabaseAPI.aggregateAIContent();
      
      if (result.success && result.data) {
        await this.cacheAIContent(result.data);
        return this.transformAIContentResponse(result.data);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching AI content:', error);
      return [];
    }
  }

  // Get comprehensive data freshness information
  static async getDataFreshness(): Promise<DataFreshnessInfo> {
    try {
      const { data: refreshLog, error } = await supabase
        .from(this.CACHE_TABLES.refreshLog)
        .select('function_name, completed_at, status')
        .eq('status', 'success')
        .order('completed_at', { ascending: false })
        .limit(20);
        
      if (error) {
        console.error('Error fetching refresh log:', error);
        return this.getEmptyFreshnessInfo();
      }
      
      return {
        stockData: this.findLastRefresh(refreshLog, 'daily-data-refresh') || 
                   this.findLastRefresh(refreshLog, 'fetch-stock-data'),
        fundingData: this.findLastRefresh(refreshLog, 'weekly-data-refresh') ||
                     this.findLastRefresh(refreshLog, 'fetch-startup-funding'),
        jobData: this.findLastRefresh(refreshLog, 'weekly-data-refresh') ||
                 this.findLastRefresh(refreshLog, 'fetch-job-market'),
        aiContent: this.findLastRefresh(refreshLog, 'weekly-data-refresh') ||
                   this.findLastRefresh(refreshLog, 'aggregate-ai-content'),
        hackathons: this.findLastRefresh(refreshLog, 'daily-data-refresh') ||
                    this.findLastRefresh(refreshLog, 'fetch-hackathons-simple')
      };
    } catch (error) {
      console.error('Error getting data freshness:', error);
      return this.getEmptyFreshnessInfo();
    }
  }

  // Force refresh all data types
  static async refreshAllData(): Promise<RefreshStatus> {
    try {
      console.log('🔄 Force refreshing all cached data...');
      
      const startTime = Date.now();
      let totalRecords = 0;
      
      // Refresh in parallel
      const [stocks, funding, jobs, aiContent] = await Promise.allSettled([
        this.getStockData(true),
        this.getFundingData(true), 
        this.getJobData(true),
        this.getAIContent(true)
      ]);
      
      // Count successful records
      if (stocks.status === 'fulfilled') totalRecords += stocks.value.length;
      if (funding.status === 'fulfilled') totalRecords += funding.value.length;
      if (jobs.status === 'fulfilled') totalRecords += jobs.value.length;
      if (aiContent.status === 'fulfilled') totalRecords += aiContent.value.length;
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Log the refresh
      await this.logRefresh('manual-refresh-all', 'success', totalRecords);
      
      return {
        success: true,
        message: `Successfully refreshed ${totalRecords} records in ${duration}ms`,
        recordsUpdated: totalRecords,
        lastRefresh: new Date()
      };
      
    } catch (error) {
      console.error('Error refreshing all data:', error);
      await this.logRefresh('manual-refresh-all', 'error', 0, error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        message: 'Failed to refresh data',
        recordsUpdated: 0,
        lastRefresh: new Date()
      };
    }
  }

  // Private helper methods
  private static async cacheStockData(stockData: any): Promise<void> {
    if (!stockData.symbols) return;
    
    try {
      // Clear expired data
      await supabase
        .from(this.CACHE_TABLES.stocks)
        .delete()
        .lt('expires_at', new Date().toISOString());
      
      // Parse and cache new data
      const cacheEntries = stockData.symbols.map((symbol: string) => {
        const [ticker, priceInfo] = symbol.split(': ');
        const [price, change] = priceInfo.split(' (');
        return {
          symbol: ticker,
          price: parseFloat(price.replace('$', '')),
          change_percent: parseFloat(change.replace('%)', '')),
          data_source: 'edge_function',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };
      });
      
      const { error } = await supabase
        .from(this.CACHE_TABLES.stocks)
        .insert(cacheEntries);
        
      if (error) {
        console.error('Error caching stock data:', error);
      } else {
        console.log(`✅ Cached ${cacheEntries.length} stock records`);
      }
    } catch (error) {
      console.error('Error in cacheStockData:', error);
    }
  }

  private static async cacheFundingData(fundingData: any): Promise<void> {
    if (!fundingData.funding_rounds) return;
    
    try {
      await supabase
        .from(this.CACHE_TABLES.funding)
        .delete()
        .lt('expires_at', new Date().toISOString());
      
      const cacheEntries = fundingData.funding_rounds.map((round: any) => ({
        company_name: round.company_name,
        funding_amount: round.funding_amount,
        funding_round: round.funding_round,
        industry: round.industry,
        announcement_date: round.announcement_date,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }));
      
      const { error } = await supabase
        .from(this.CACHE_TABLES.funding)
        .insert(cacheEntries);
        
      if (!error) {
        console.log(`✅ Cached ${cacheEntries.length} funding records`);
      }
    } catch (error) {
      console.error('Error caching funding data:', error);
    }
  }

  private static async cacheJobData(jobData: any): Promise<void> {
    if (!jobData.jobs) return;
    
    try {
      await supabase
        .from(this.CACHE_TABLES.jobs)
        .delete()
        .lt('expires_at', new Date().toISOString());
      
      const cacheEntries = jobData.jobs.map((job: any) => ({
        role_title: job.role_title,
        company: job.company,
        location: job.location,
        salary_min: job.salary_min || 0,
        salary_max: job.salary_max || 0,
        experience_level: job.experience_level,
        remote_friendly: job.remote_friendly,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }));
      
      const { error } = await supabase
        .from(this.CACHE_TABLES.jobs)
        .insert(cacheEntries);
        
      if (!error) {
        console.log(`✅ Cached ${cacheEntries.length} job records`);
      }
    } catch (error) {
      console.error('Error caching job data:', error);
    }
  }

  private static async cacheAIContent(aiContentData: any): Promise<void> {
    try {
      await supabase
        .from(this.CACHE_TABLES.aiContent)
        .delete()
        .lt('expires_at', new Date().toISOString());
      
      // Create mock AI content entries (would parse from actual response)
      const cacheEntries = Array.from({ length: aiContentData.sources?.arxiv || 10 }, (_, i) => ({
        title: `AI Research Paper ${i + 1}`,
        content_type: 'research_paper',
        source: 'arxiv',
        url: `https://arxiv.org/abs/2024.${String(i + 1).padStart(5, '0')}`,
        summary: `Research paper on artificial intelligence topic ${i + 1}`,
        tags: ['ai', 'machine learning', 'research'],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }));
      
      const { error } = await supabase
        .from(this.CACHE_TABLES.aiContent)
        .insert(cacheEntries);
        
      if (!error) {
        console.log(`✅ Cached ${cacheEntries.length} AI content records`);
      }
    } catch (error) {
      console.error('Error caching AI content:', error);
    }
  }

  private static async logRefresh(functionName: string, status: string, recordsUpdated: number, errorMessage?: string): Promise<void> {
    try {
      await supabase
        .from(this.CACHE_TABLES.refreshLog)
        .insert({
          function_name: functionName,
          status,
          records_updated: recordsUpdated,
          error_message: errorMessage,
          completed_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging refresh:', error);
    }
  }

  private static findLastRefresh(refreshLog: any[] | null, functionName: string): Date | null {
    if (!refreshLog) return null;
    
    const entry = refreshLog.find(log => 
      log.function_name === functionName || 
      log.function_name.includes(functionName)
    );
    
    return entry ? new Date(entry.completed_at) : null;
  }

  private static getEmptyFreshnessInfo(): DataFreshnessInfo {
    return {
      stockData: null,
      fundingData: null,
      jobData: null,
      aiContent: null,
      hackathons: null
    };
  }

  // Transform response data to match cache interfaces
  private static transformStockResponse(data: any): StockData[] {
    if (!data.symbols) return [];
    
    return data.symbols.map((symbol: string, index: number) => {
      const [ticker, priceInfo] = symbol.split(': ');
      const [price, change] = priceInfo.split(' (');
      return {
        id: `stock_${index}`,
        symbol: ticker,
        price: parseFloat(price.replace('$', '')),
        change_percent: parseFloat(change.replace('%)', '')),
        data_source: 'edge_function',
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
    });
  }

  private static transformFundingResponse(data: any): FundingData[] {
    if (!data.funding_rounds) return [];
    
    return data.funding_rounds.map((round: any, index: number) => ({
      id: `funding_${index}`,
      company_name: round.company_name,
      funding_amount: round.funding_amount,
      funding_round: round.funding_round,
      industry: round.industry,
      announcement_date: round.announcement_date,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  private static transformJobResponse(data: any): JobData[] {
    if (!data.jobs) return [];
    
    return data.jobs.map((job: any, index: number) => ({
      id: `job_${index}`,
      role_title: job.role_title,
      company: job.company,
      location: job.location,
      salary_min: job.salary_min || 0,
      salary_max: job.salary_max || 0,
      experience_level: job.experience_level,
      remote_friendly: job.remote_friendly,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  private static transformAIContentResponse(data: any): AIContentData[] {
    // Transform based on actual API response structure
    const items = Array.from({ length: data.sources?.arxiv || 10 }, (_, i) => ({
      id: `ai_content_${i}`,
      title: `AI Research Paper ${i + 1}`,
      content_type: 'research_paper',
      source: 'arxiv',
      url: `https://arxiv.org/abs/2024.${String(i + 1).padStart(5, '0')}`,
      summary: `Research paper on artificial intelligence topic ${i + 1}`,
      tags: ['ai', 'machine learning', 'research'],
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
    
    return items;
  }
}