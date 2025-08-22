import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Hackathon } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  Trophy,
  Calendar,
  MapPin,
  Search,
  Filter,
  Heart,
  ExternalLink,
  RefreshCw,
  Plus,
  Star,
  Clock,
  DollarSign,
  Globe,
  Tag,
  Bell,
  Bookmark,
  BookmarkCheck,
  HeartIcon,
  Settings
} from 'lucide-react'

interface SavedHackathon {
  id: string
  user_id: string
  hackathon_id: string
  is_favorite: boolean
  reminder_set: boolean
  reminder_date?: string
  notes?: string
  created_at: string
}

interface HackathonWithSaved extends Hackathon {
  saved?: SavedHackathon
  isSaved?: boolean
  isFavorite?: boolean
  hasReminder?: boolean
}

const PLATFORMS = ['DevPost', 'HackerEarth', 'MLH', 'AngelHack', 'HackerRank', 'Other']
const LOCATIONS = ['Virtual', 'United States', 'Europe', 'Asia', 'Canada', 'Australia', 'Global']
const PRIZE_RANGES = [
  { label: 'All', min: 0, max: Infinity },
  { label: '$1K+', min: 1000, max: 4999 },
  { label: '$5K+', min: 5000, max: 9999 },
  { label: '$10K+', min: 10000, max: 49999 },
  { label: '$50K+', min: 50000, max: Infinity },
]

export function Hackathons() {
  const { user } = useAuth()
  const [hackathons, setHackathons] = useState<HackathonWithSaved[]>([])
  const [savedHackathons, setSavedHackathons] = useState<SavedHackathon[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedPrizeRange, setSelectedPrizeRange] = useState(PRIZE_RANGES[0])
  const [dateFilter, setDateFilter] = useState<'upcoming' | 'this_month' | 'next_3_months' | 'all'>('upcoming')
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [showOnlySaved, setShowOnlySaved] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'prize' | 'name'>('date')

  const fetchHackathons = async () => {
    try {
      let query = supabase.from('hackathons').select('*')
      
      // Apply date filters
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      
      switch (dateFilter) {
        case 'upcoming':
          query = query.gte('start_date', todayStr)
          break
        case 'this_month': {
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
          query = query.gte('start_date', todayStr).lte('start_date', endOfMonth)
          break
        }
        case 'next_3_months': {
          const threeMonthsLater = new Date(today.getFullYear(), today.getMonth() + 3, 0).toISOString().split('T')[0]
          query = query.gte('start_date', todayStr).lte('start_date', threeMonthsLater)
          break
        }
        case 'all':
          // No date filter
          break
      }

      // Sort by selected criteria
      switch (sortBy) {
        case 'date':
          query = query.order('start_date', { ascending: true })
          break
        case 'prize':
          query = query.order('prize_amount', { ascending: false, nullsLast: true })
          break
        case 'name':
          query = query.order('name', { ascending: true })
          break
      }

      const { data: hackathonData, error } = await query

      if (error) throw error

      // Fetch saved hackathons for the current user
      const { data: savedData, error: savedError } = await supabase
        .from('user_hackathons')
        .select('*')
        .eq('user_id', user?.id)

      if (savedError) throw savedError

      setSavedHackathons(savedData || [])

      // Combine hackathons with saved status
      const hackathonsWithSaved: HackathonWithSaved[] = (hackathonData || []).map(hackathon => {
        const saved = savedData?.find(s => s.hackathon_id === hackathon.id)
        return {
          ...hackathon,
          saved,
          isSaved: !!saved,
          isFavorite: saved?.is_favorite || false,
          hasReminder: saved?.reminder_set || false
        }
      })

      setHackathons(hackathonsWithSaved)
    } catch (error) {
      console.error('Error fetching hackathons:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshHackathons = async () => {
    setRefreshing(true)
    try {
      // Trigger edge function to fetch latest hackathons
      await supabase.functions.invoke('fetch-hackathons')
      await fetchHackathons()
    } catch (error) {
      console.error('Error refreshing hackathons:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const toggleSaveHackathon = async (hackathonId: string) => {
    try {
      const existing = savedHackathons.find(s => s.hackathon_id === hackathonId)
      
      if (existing) {
        // Remove saved hackathon
        const { error } = await supabase
          .from('user_hackathons')
          .delete()
          .eq('id', existing.id)

        if (error) throw error

        setSavedHackathons(prev => prev.filter(s => s.id !== existing.id))
        setHackathons(prev => prev.map(h => h.id === hackathonId ? {
          ...h,
          saved: undefined,
          isSaved: false,
          isFavorite: false,
          hasReminder: false
        } : h))
      } else {
        // Add saved hackathon
        const { data, error } = await supabase
          .from('user_hackathons')
          .insert({
            user_id: user?.id,
            hackathon_id: hackathonId,
            is_favorite: false,
            reminder_set: false
          })
          .select()
          .single()

        if (error) throw error

        setSavedHackathons(prev => [...prev, data])
        setHackathons(prev => prev.map(h => h.id === hackathonId ? {
          ...h,
          saved: data,
          isSaved: true,
          isFavorite: false,
          hasReminder: false
        } : h))
      }
    } catch (error) {
      console.error('Error toggling save:', error)
    }
  }

  const toggleFavoriteHackathon = async (hackathonId: string) => {
    try {
      const saved = savedHackathons.find(s => s.hackathon_id === hackathonId)
      
      if (!saved) {
        // First save the hackathon, then mark as favorite
        await toggleSaveHackathon(hackathonId)
        // Update will happen in the next call
        setTimeout(() => toggleFavoriteHackathon(hackathonId), 100)
        return
      }

      const { error } = await supabase
        .from('user_hackathons')
        .update({ is_favorite: !saved.is_favorite })
        .eq('id', saved.id)

      if (error) throw error

      const updatedSaved = { ...saved, is_favorite: !saved.is_favorite }
      setSavedHackathons(prev => prev.map(s => s.id === saved.id ? updatedSaved : s))
      setHackathons(prev => prev.map(h => h.id === hackathonId ? {
        ...h,
        saved: updatedSaved,
        isFavorite: !saved.is_favorite
      } : h))
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const setReminder = async (hackathonId: string, reminderDate: string) => {
    try {
      const saved = savedHackathons.find(s => s.hackathon_id === hackathonId)
      
      if (!saved) {
        await toggleSaveHackathon(hackathonId)
        setTimeout(() => setReminder(hackathonId, reminderDate), 100)
        return
      }

      const { error } = await supabase
        .from('user_hackathons')
        .update({ 
          reminder_set: true,
          reminder_date: reminderDate
        })
        .eq('id', saved.id)

      if (error) throw error

      const updatedSaved = { ...saved, reminder_set: true, reminder_date: reminderDate }
      setSavedHackathons(prev => prev.map(s => s.id === saved.id ? updatedSaved : s))
      setHackathons(prev => prev.map(h => h.id === hackathonId ? {
        ...h,
        saved: updatedSaved,
        hasReminder: true
      } : h))
    } catch (error) {
      console.error('Error setting reminder:', error)
    }
  }

  useEffect(() => {
    fetchHackathons()
  }, [dateFilter, sortBy])

  // Filter hackathons based on search and filter criteria
  const filteredHackathons = hackathons.filter(hackathon => {
    // Search filter
    if (searchTerm && !hackathon.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !hackathon.description?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !hackathon.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false
    }

    // Platform filter
    if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(hackathon.platform)) {
      return false
    }

    // Location filter
    if (selectedLocations.length > 0) {
      const matchesVirtual = selectedLocations.includes('Virtual') && hackathon.is_virtual
      const matchesLocation = hackathon.location && selectedLocations.some(loc => 
        loc !== 'Virtual' && hackathon.location?.includes(loc)
      )
      if (!matchesVirtual && !matchesLocation) {
        return false
      }
    }

    // Prize range filter
    if (selectedPrizeRange.min > 0 || selectedPrizeRange.max < Infinity) {
      const prize = hackathon.prize_amount || 0
      if (prize < selectedPrizeRange.min || prize > selectedPrizeRange.max) {
        return false
      }
    }

    // Favorites filter
    if (showOnlyFavorites && !hackathon.isFavorite) {
      return false
    }

    // Saved filter
    if (showOnlySaved && !hackathon.isSaved) {
      return false
    }

    return true
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatPrize = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return `$${amount}`
  }

  const getDaysUntilStart = (startDate: string) => {
    const today = new Date()
    const start = new Date(startDate)
    const diffTime = start.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Hackathons Hub
            </h1>
            <p className="text-gray-400">
              Discover, track, and participate in hackathons worldwide
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={refreshHackathons}
              disabled={refreshing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-300 text-sm font-medium">Total Hackathons</span>
            </div>
            <div className="text-2xl font-bold text-white">{hackathons.length}</div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Bookmark className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300 text-sm font-medium">Saved</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {hackathons.filter(h => h.isSaved).length}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-5 h-5 text-red-400" />
              <span className="text-gray-300 text-sm font-medium">Favorites</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {hackathons.filter(h => h.isFavorite).length}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-5 h-5 text-green-400" />
              <span className="text-gray-300 text-sm font-medium">Reminders</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {hackathons.filter(h => h.hasReminder).length}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search hackathons, technologies, descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="upcoming">Upcoming</option>
                <option value="this_month">This Month</option>
                <option value="next_3_months">Next 3 Months</option>
                <option value="all">All Hackathons</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="prize">Sort by Prize</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>

          {/* Filter Options */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                showOnlyFavorites
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Heart className="w-4 h-4" />
              Favorites Only
            </button>

            <button
              onClick={() => setShowOnlySaved(!showOnlySaved)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                showOnlySaved
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Saved Only
            </button>

            {/* Platform filters */}
            {PLATFORMS.map(platform => (
              <button
                key={platform}
                onClick={() => {
                  setSelectedPlatforms(prev =>
                    prev.includes(platform)
                      ? prev.filter(p => p !== platform)
                      : [...prev, platform]
                  )
                }}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedPlatforms.includes(platform)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        {/* Hackathons Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredHackathons.map((hackathon) => {
            const daysUntilStart = hackathon.start_date ? getDaysUntilStart(hackathon.start_date) : null
            
            return (
              <div key={hackathon.id} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
                {/* Header with actions */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                      {hackathon.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded-full text-xs">
                        {hackathon.platform}
                      </span>
                      {hackathon.prize_amount && (
                        <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded-full text-xs font-medium">
                          {formatPrize(hackathon.prize_amount)}
                        </span>
                      )}
                      {daysUntilStart !== null && daysUntilStart >= 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          daysUntilStart <= 7 
                            ? 'bg-red-900/50 text-red-300' 
                            : daysUntilStart <= 30
                            ? 'bg-yellow-900/50 text-yellow-300'
                            : 'bg-blue-900/50 text-blue-300'
                        }`}>
                          {daysUntilStart === 0 ? 'Today' : daysUntilStart === 1 ? 'Tomorrow' : `${daysUntilStart}d`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFavoriteHackathon(hackathon.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        hackathon.isFavorite
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-red-400'
                      }`}
                      title={hackathon.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className="w-4 h-4" fill={hackathon.isFavorite ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      onClick={() => toggleSaveHackathon(hackathon.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        hackathon.isSaved
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-blue-400'
                      }`}
                      title={hackathon.isSaved ? 'Remove from saved' : 'Save hackathon'}
                    >
                      {hackathon.isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Description */}
                {hackathon.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                    {hackathon.description}
                  </p>
                )}

                {/* Tags */}
                {hackathon.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {hackathon.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {hackathon.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-xs">
                        +{hackathon.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {hackathon.start_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(hackathon.start_date)}</span>
                      {hackathon.end_date && hackathon.end_date !== hackathon.start_date && (
                        <span>- {formatDate(hackathon.end_date)}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    {hackathon.is_virtual ? (
                      <>
                        <Globe className="w-4 h-4" />
                        <span>Virtual Event</span>
                      </>
                    ) : hackathon.location ? (
                      <>
                        <MapPin className="w-4 h-4" />
                        <span>{hackathon.location}</span>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {hackathon.isSaved && (
                      <button
                        onClick={() => {
                          if (hackathon.start_date) {
                            const reminderDate = new Date(hackathon.start_date)
                            reminderDate.setDate(reminderDate.getDate() - 7) // 7 days before
                            setReminder(hackathon.id, reminderDate.toISOString())
                          }
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                          hackathon.hasReminder
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        <Bell className="w-3 h-3" />
                        {hackathon.hasReminder ? 'Reminded' : 'Remind Me'}
                      </button>
                    )}
                  </div>

                  {hackathon.url && (
                    <a
                      href={hackathon.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      View Details
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty state */}
        {filteredHackathons.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No hackathons found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your filters or search terms to find more hackathons.
            </p>
            <button
              onClick={refreshHackathons}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Hackathons
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}