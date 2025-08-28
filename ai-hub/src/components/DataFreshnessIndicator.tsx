/**
 * Data Freshness Indicator Component
 * Shows when data was last refreshed with visual indicators and manual refresh option
 */

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Database 
} from 'lucide-react';
import { CachedDataService, type DataFreshnessInfo, type RefreshStatus } from '@/services/cached-data-service';

interface DataFreshnessIndicatorProps {
  dataType?: 'stocks' | 'funding' | 'jobs' | 'aiContent' | 'all';
  showRefreshButton?: boolean;
  showDetailedStatus?: boolean;
  className?: string;
}

export function DataFreshnessIndicator({
  dataType = 'all',
  showRefreshButton = true,
  showDetailedStatus = false,
  className = ''
}: DataFreshnessIndicatorProps) {
  const [freshness, setFreshness] = useState<DataFreshnessInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFreshness();
  }, []);

  const loadFreshness = async () => {
    try {
      setLoading(true);
      const freshnessData = await CachedDataService.getDataFreshness();
      setFreshness(freshnessData);
    } catch (error) {
      console.error('Error loading data freshness:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    
    try {
      setRefreshing(true);
      const status = await CachedDataService.refreshAllData();
      setRefreshStatus(status);
      
      // Reload freshness data after refresh
      await loadFreshness();
      
      // Clear status after 5 seconds
      setTimeout(() => setRefreshStatus(null), 5000);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setRefreshStatus({
        success: false,
        message: 'Failed to refresh data',
        recordsUpdated: 0,
        lastRefresh: new Date()
      });
      setTimeout(() => setRefreshStatus(null), 5000);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (lastUpdate: Date | null) => {
    if (!lastUpdate) return { text: 'text-gray-400', bg: 'bg-gray-400' };
    
    const hoursAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    if (hoursAgo < 24) return { text: 'text-green-400', bg: 'bg-green-400' };
    if (hoursAgo < 168) return { text: 'text-yellow-400', bg: 'bg-yellow-400' }; // 7 days
    return { text: 'text-red-400', bg: 'bg-red-400' };
  };

  const getStatusIcon = (lastUpdate: Date | null) => {
    if (!lastUpdate) return <XCircle className="w-3 h-3" />;
    
    const hoursAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    if (hoursAgo < 24) return <CheckCircle className="w-3 h-3" />;
    if (hoursAgo < 168) return <AlertTriangle className="w-3 h-3" />;
    return <XCircle className="w-3 h-3" />;
  };

  const getDataForType = (type: string): Date | null => {
    if (!freshness) return null;
    
    switch (type) {
      case 'stocks': return freshness.stockData;
      case 'funding': return freshness.fundingData;
      case 'jobs': return freshness.jobData;
      case 'aiContent': return freshness.aiContent;
      case 'hackathons': return freshness.hackathons;
      default: return null;
    }
  };

  const getMostRecentUpdate = (): Date | null => {
    if (!freshness) return null;
    
    const dates = [
      freshness.stockData,
      freshness.fundingData,
      freshness.jobData,
      freshness.aiContent,
      freshness.hackathons
    ].filter(Boolean) as Date[];
    
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates.map(d => d.getTime())));
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-xs ${className}`}>
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        <span className="text-gray-400">Loading data status...</span>
      </div>
    );
  }

  // Single data type display
  if (dataType !== 'all') {
    const lastUpdate = getDataForType(dataType);
    const status = getStatusColor(lastUpdate);
    
    return (
      <div className={`flex items-center gap-2 text-xs ${className}`}>
        <div className={`${status.text}`}>
          {getStatusIcon(lastUpdate)}
        </div>
        <span className="text-gray-400">
          {lastUpdate 
            ? `Updated ${formatDistanceToNow(lastUpdate)} ago`
            : 'No data available'
          }
        </span>
        {showRefreshButton && (
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className={`${status.text} hover:text-blue-300 ml-2 flex items-center gap-1 ${
              refreshing ? 'animate-spin' : ''
            }`}
            title="Refresh data"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // All data types overview
  const mostRecent = getMostRecentUpdate();
  const overallStatus = getStatusColor(mostRecent);

  return (
    <div className={`${className}`}>
      {/* Main indicator */}
      <div className="flex items-center gap-2 text-xs mb-2">
        <div className={`${overallStatus.text} flex items-center gap-1`}>
          <Database className="w-3 h-3" />
          {getStatusIcon(mostRecent)}
        </div>
        <span className="text-gray-400">
          {mostRecent 
            ? `Data refreshed ${formatDistanceToNow(mostRecent)} ago`
            : 'No cached data available'
          }
        </span>
        {showRefreshButton && (
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className={`${overallStatus.text} hover:text-blue-300 ml-2 flex items-center gap-1 transition-transform ${
              refreshing ? 'animate-spin' : 'hover:scale-110'
            }`}
            title="Refresh all data"
          >
            <RefreshCw className="w-3 h-3" />
            {refreshing && <span className="text-xs">Refreshing...</span>}
          </button>
        )}
      </div>

      {/* Refresh status message */}
      {refreshStatus && (
        <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${
          refreshStatus.success 
            ? 'bg-green-900/20 text-green-400 border border-green-800' 
            : 'bg-red-900/20 text-red-400 border border-red-800'
        }`}>
          {refreshStatus.success ? (
            <CheckCircle className="w-3 h-3 flex-shrink-0" />
          ) : (
            <XCircle className="w-3 h-3 flex-shrink-0" />
          )}
          <span>{refreshStatus.message}</span>
          {refreshStatus.success && refreshStatus.recordsUpdated > 0 && (
            <span className="text-gray-400">({refreshStatus.recordsUpdated} records)</span>
          )}
        </div>
      )}

      {/* Detailed breakdown */}
      {showDetailedStatus && freshness && (
        <div className="grid grid-cols-2 gap-2 text-xs mt-3">
          {[
            { key: 'stockData', label: '📊 Stocks', data: freshness.stockData },
            { key: 'fundingData', label: '💰 Funding', data: freshness.fundingData },
            { key: 'jobData', label: '💼 Jobs', data: freshness.jobData },
            { key: 'aiContent', label: '🧠 AI Content', data: freshness.aiContent },
            { key: 'hackathons', label: '🏆 Hackathons', data: freshness.hackathons },
          ].map(({ key, label, data }) => {
            const status = getStatusColor(data);
            return (
              <div key={key} className="flex items-center gap-2 p-2 rounded bg-gray-800/30">
                <div className={`w-2 h-2 rounded-full ${status.bg}`} />
                <span className="text-gray-300">{label}</span>
                <span className={`${status.text} text-xs ml-auto`}>
                  {data ? formatDistanceToNow(data, { addSuffix: true }) : 'Never'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Compact version for status bars
export function CompactDataStatus({ className = '' }: { className?: string }) {
  return (
    <DataFreshnessIndicator 
      dataType="all"
      showRefreshButton={false}
      showDetailedStatus={false}
      className={className}
    />
  );
}

// Detailed version for settings/admin pages
export function DetailedDataStatus({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Data Freshness Status
      </h3>
      <DataFreshnessIndicator 
        dataType="all"
        showRefreshButton={true}
        showDetailedStatus={true}
      />
    </div>
  );
}