import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { AIContent, Project, Hackathon } from '@/lib/supabase';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  BookOpen,
  Trophy,
  Eye,
  Star,
  Clock,
  Zap,
  Target,
  Award,
  Brain,
  Globe,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  PieChart,
  LineChart,
  Activity,
  Filter,
  Download
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Custom CSS-based chart components
const ProgressBar = ({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full bg-gray-700 rounded-full h-3">
      <div
        className={`h-3 rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
};

const CSSBarChart = ({ data, title }: { data: Array<{ name: string; value: number; color?: string }>; title: string }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-3">
            <div className="w-24 text-sm text-gray-400 truncate">{item.name}</div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-300">{item.value}</span>
                <span className="text-xs text-gray-500">{Math.round((item.value / maxValue) * 100)}%</span>
              </div>
              <ProgressBar
                value={item.value}
                max={maxValue}
                color={item.color || 'bg-blue-500'}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CSSPieChart = ({ data, title }: { data: Array<{ name: string; value: number; color: string }>; title: string }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="relative w-48 h-48 mx-auto mb-4">
            <svg viewBox="0 0 200 200" className="transform -rotate-90">
              {data.map((item, index) => {
                const percentage = (item.value / total) * 100;
                const angle = (percentage / 100) * 360;
                const startAngle = cumulativePercentage * 3.6;
                const endAngle = startAngle + angle;

                const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);

                const largeArcFlag = percentage > 50 ? 1 : 0;

                cumulativePercentage += percentage;

                return (
                  <path
                    key={item.name}
                    d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={item.color}
                    stroke="rgba(17, 24, 39, 0.8)"
                    strokeWidth="1"
                  />
                );
              })}
              <circle cx="100" cy="100" r="40" fill="rgba(17, 24, 39, 0.9)" />
              <text x="100" y="95" textAnchor="middle" className="text-white text-sm font-semibold">
                {total}
              </text>
              <text x="100" y="110" textAnchor="middle" className="text-gray-400 text-xs">
                Total
              </text>
            </svg>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">{item.name}</span>
                  <span className="text-sm text-gray-400">
                    {item.value} ({Math.round((item.value / total) * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface AnalyticsData {
  aiContent: AIContent[];
  projects: Project[];
  hackathons: Hackathon[];
  userHackathons: any[];
  newsletters: any[];
  stockData: any[];
}

interface ContentStats {
  total: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  readStatus: { read: number; unread: number };
  recentActivity: number;
  growthRate: number;
}

interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  byCategory: Record<string, number>;
}

interface HackathonStats {
  total: number;
  saved: number;
  favorites: number;
  reminders: number;
  upcoming: number;
}

export function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    aiContent: [],
    projects: [],
    hackathons: [],
    userHackathons: [],
    newsletters: [],
    stockData: []
  });

  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'content' | 'projects' | 'hackathons' | 'all'>('all');

  useEffect(() => {
    fetchAnalyticsData();
  }, [user, selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    if (!user) return;

    try {
      // Get date range for filtering
      const now = new Date();
      let startDate = new Date();

      switch (selectedTimeRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case 'all':
          startDate = new Date('2020-01-01'); // Arbitrary old date
          break;
      }

      const startDateStr = startDate.toISOString();

      // Fetch all data sources
      const [
        { data: contentData },
        { data: projectsData },
        { data: hackathonsData },
        { data: userHackathonsData },
        { data: newslettersData },
        { data: stockData }
      ] = await Promise.all([
        supabase.from('ai_content').select('*').gte('created_at', startDateStr),
        supabase.from('projects').select('*').eq('user_id', user.id).gte('created_at', startDateStr),
        supabase.from('hackathons').select('*'),
        supabase.from('user_hackathons').select('*').eq('user_id', user.id),
        supabase.from('newsletters').select('*').eq('user_id', user.id).gte('created_at', startDateStr),
        supabase.from('stock_data').select('*').gte('created_at', startDateStr)
      ]);

      setAnalyticsData({
        aiContent: contentData || [],
        projects: projectsData || [],
        hackathons: hackathonsData || [],
        userHackathons: userHackathonsData || [],
        newsletters: newslettersData || [],
        stockData: stockData || []
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateContentStats = (data: AIContent[]): ContentStats => {
    const total = data.length;
    const byType = data.reduce((acc, item) => {
      acc[item.content_type] = (acc[item.content_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySource = data.reduce((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const readStatus = data.reduce((acc, item) => {
      if (item.is_read) acc.read++;
      else acc.unread++;
      return acc;
    }, { read: 0, unread: 0 });

    const recentActivity = data.filter(item =>
      new Date(item.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    // Calculate growth rate (comparing last 30 days to previous 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const recentContent = data.filter(item => new Date(item.created_at) > thirtyDaysAgo).length;
    const olderContent = data.filter(item =>
      new Date(item.created_at) <= thirtyDaysAgo &&
      new Date(item.created_at) > sixtyDaysAgo
    ).length;

    const growthRate = olderContent > 0 ? ((recentContent - olderContent) / olderContent) * 100 : 0;

    return { total, byType, bySource, readStatus, recentActivity, growthRate };
  };

  const calculateProjectStats = (data: Project[]): ProjectStats => {
    const total = data.length;
    const active = data.filter(p => p.status === 'active' || p.status === 'in_progress').length;
    const completed = data.filter(p => p.status === 'completed').length;

    const byCategory = data.reduce((acc, project) => {
      const category = project.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, active, completed, byCategory };
  };

  const calculateHackathonStats = (data: AnalyticsData): HackathonStats => {
    const total = data.hackathons.length;
    const saved = data.userHackathons.length;
    const favorites = data.userHackathons.filter(uh => uh.is_favorite).length;
    const reminders = data.userHackathons.filter(uh => uh.reminder_set).length;

    const upcoming = data.hackathons.filter(h =>
      h.start_date && new Date(h.start_date) > new Date()
    ).length;

    return { total, saved, favorites, reminders, upcoming };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  const contentStats = calculateContentStats(analyticsData.aiContent);
  const projectStats = calculateProjectStats(analyticsData.projects);
  const hackathonStats = calculateHackathonStats(analyticsData);

  // Prepare chart data
  const contentTypeData = Object.entries(contentStats.byType).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
    percentage: Math.round((count / contentStats.total) * 100)
  }));

  const contentTrendData = analyticsData.aiContent
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .reduce((acc, item) => {
      const month = new Date(item.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
      const existing = acc.find(item => item.name === month);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ name: month, count: 1 });
      }
      return acc;
    }, [] as Array<{ name: string; count: number }>);

  const sourceData = Object.entries(contentStats.bySource)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([source, count]) => ({
      name: source,
      count,
      percentage: Math.round((count / contentStats.total) * 100)
    }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">
            Comprehensive insights into your AI research and platform activity
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Time Range:</span>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Focus:</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Metrics</option>
              <option value="content">Content</option>
              <option value="projects">Projects</option>
              <option value="hackathons">Hackathons</option>
            </select>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300 text-sm font-medium">Content Items</span>
            </div>
            <div className="text-2xl font-bold text-white">{contentStats.total}</div>
            <div className={`text-xs mt-1 ${contentStats.growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {contentStats.growthRate >= 0 ? '+' : ''}{contentStats.growthRate.toFixed(1)}% from last period
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-green-400" />
              <span className="text-gray-300 text-sm font-medium">Recent Activity</span>
            </div>
            <div className="text-2xl font-bold text-white">{contentStats.recentActivity}</div>
            <div className="text-xs text-gray-400 mt-1">Items added this week</div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-gray-300 text-sm font-medium">Active Projects</span>
            </div>
            <div className="text-2xl font-bold text-white">{projectStats.active}</div>
            <div className="text-xs text-gray-400 mt-1">of {projectStats.total} total</div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-300 text-sm font-medium">Hackathon Interest</span>
            </div>
            <div className="text-2xl font-bold text-white">{hackathonStats.saved}</div>
            <div className="text-xs text-gray-400 mt-1">saved hackathons</div>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Content Type Distribution */}
          <CSSPieChart
            data={contentTypeData.map((item, index) => ({
              name: item.name,
              value: item.value,
              color: COLORS[index % COLORS.length]
            }))}
            title="Content Type Distribution"
          />

          {/* Content Trend */}
          <CSSBarChart
            data={contentTrendData.slice(-6).map((item, index) => ({
              name: item.name,
              value: item.count,
              color: COLORS[index % COLORS.length]
            }))}
            title="Content Growth Trend"
          />
        </div>

        {/* Content Sources */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Top Content Sources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sourceData.map((source, index) => (
              <div key={source.name} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 font-medium truncate">{source.name}</span>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">{source.count}</span>
                  <span className="text-sm text-gray-400">{source.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Status */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Project Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{projectStats.active}</div>
              <div className="text-gray-300">Active Projects</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{projectStats.completed}</div>
              <div className="text-gray-300">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {projectStats.total > 0 ? Math.round((projectStats.completed / projectStats.total) * 100) : 0}%
              </div>
              <div className="text-gray-300">Completion Rate</div>
            </div>
          </div>
        </div>

        {/* Hackathon Engagement */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Hackathon Engagement
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">{hackathonStats.total}</div>
              <div className="text-xs text-gray-400">Total Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">{hackathonStats.saved}</div>
              <div className="text-xs text-gray-400">Saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400 mb-1">{hackathonStats.favorites}</div>
              <div className="text-xs text-gray-400">Favorites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">{hackathonStats.upcoming}</div>
              <div className="text-xs text-gray-400">Upcoming</div>
            </div>
          </div>
        </div>

        {/* Content Read Status */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Reading Progress
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-300">Read Status</span>
                <span className="text-sm text-gray-400">
                  {contentStats.readStatus.read} of {contentStats.total} items
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
                <div
                  className="bg-green-500 h-4 rounded-full transition-all duration-300"
                  style={{
                    width: contentStats.total > 0
                      ? `${(contentStats.readStatus.read / contentStats.total) * 100}%`
                      : '0%'
                  }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-400">Read: {contentStats.readStatus.read}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-gray-400">Unread: {contentStats.readStatus.unread}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">
                  {contentStats.total > 0
                    ? Math.round((contentStats.readStatus.read / contentStats.total) * 100)
                    : 0}% reading completion rate
                </span>
              </div>

              <div className="flex items-center gap-2 text-blue-400">
                <Brain className="w-4 h-4" />
                <span className="text-sm">
                  {contentStats.recentActivity} new items this week
                </span>
              </div>

              <div className="flex items-center gap-2 text-purple-400">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">
                  {analyticsData.newsletters.length} newsletters generated
                </span>
              </div>

              <div className="flex items-center gap-2 text-yellow-400">
                <Star className="w-4 h-4" />
                <span className="text-sm">
                  {analyticsData.stockData.length} stock data points tracked
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
