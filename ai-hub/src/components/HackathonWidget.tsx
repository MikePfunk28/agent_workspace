import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Hackathon } from '@/lib/supabase'
import {
  Trophy,
  Calendar,
  MapPin,
  ExternalLink,
  Heart,
  Bookmark,
  BookmarkCheck,
  Bell,
  Globe,
  ChevronRight,
  Plus
} from 'lucide-react'
import { Link } from 'react-router-dom'

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

interface HackathonWidgetProps {
  showFavoritesOnly?: boolean
  showSavedOnly?: boolean
  limit?: number
  title?: string
  className?: string
}

export function HackathonWidget({ 
  showFavoritesOnly = false,
  showSavedOnly = false,
  limit = 3,
  title = "Upcoming Hackathons",
  className = ""
}: HackathonWidgetProps) {
  const { user } = useAuth()
  const [hackathons, setHackathons] = useState<HackathonWithSaved[]>([])
  const [savedHackathons, setSavedHackathons] = useState<SavedHackathon[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHackathons = async () => {
    try {
      // Fetch upcoming hackathons
      const today = new Date().toISOString().split('T')[0]
      const { data: hackathonData, error } = await supabase
        .from('hackathons')
        .select('*')
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(showFavoritesOnly || showSavedOnly ? 50 : limit)

      if (error) throw error

      // Fetch saved hackathons for the current user
      const { data: savedData, error: savedError } = await supabase
        .from('user_hackathons')
        .select('*')
        .eq('user_id', user?.id)

      if (savedError) throw savedError

      setSavedHackathons(savedData || [])

      // Combine hackathons with saved status
      let hackathonsWithSaved: HackathonWithSaved[] = (hackathonData || []).map(hackathon => {
        const saved = savedData?.find(s => s.hackathon_id === hackathon.id)
        return {
          ...hackathon,
          saved,
          isSaved: !!saved,
          isFavorite: saved?.is_favorite || false,
          hasReminder: saved?.reminder_set || false
        }
      })

      // Apply filters
      if (showFavoritesOnly) {
        hackathonsWithSaved = hackathonsWithSaved.filter(h => h.isFavorite)
      }
      if (showSavedOnly) {
        hackathonsWithSaved = hackathonsWithSaved.filter(h => h.isSaved)
      }

      // Limit results after filtering
      hackathonsWithSaved = hackathonsWithSaved.slice(0, limit)

      setHackathons(hackathonsWithSaved)
    } catch (error) {
      console.error('Error fetching hackathons:', error)
    } finally {
      setLoading(false)
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

  useEffect(() => {
    fetchHackathons()
  }, [showFavoritesOnly, showSavedOnly, limit])

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
      <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <Trophy className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-800 rounded mb-2"></div>
              <div className="h-3 bg-gray-800 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gray-400" />
          <Link
            to="/hackathons"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors flex items-center gap-1"
          >
            View All
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {hackathons.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-3">
              {showFavoritesOnly ? 'No favorite hackathons yet' : 
               showSavedOnly ? 'No saved hackathons yet' : 
               'No upcoming hackathons found'}
            </p>
            <Link
              to="/hackathons"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Explore Hackathons →
            </Link>
          </div>
        ) : (
          hackathons.map((hackathon) => {
            const daysUntilStart = hackathon.start_date ? getDaysUntilStart(hackathon.start_date) : null
            
            return (
              <div key={hackathon.id} className="border-b border-gray-800 last:border-b-0 pb-4 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-medium line-clamp-2">
                        {hackathon.name}
                      </h3>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            toggleFavoriteHackathon(hackathon.id)
                          }}
                          className={`p-1 rounded transition-colors ${
                            hackathon.isFavorite
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-gray-500 hover:text-red-400'
                          }`}
                          title={hackathon.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Heart className="w-3 h-3" fill={hackathon.isFavorite ? 'currentColor' : 'none'} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            toggleSaveHackathon(hackathon.id)
                          }}
                          className={`p-1 rounded transition-colors ${
                            hackathon.isSaved
                              ? 'text-blue-400 hover:text-blue-300'
                              : 'text-gray-500 hover:text-blue-400'
                          }`}
                          title={hackathon.isSaved ? 'Remove from saved' : 'Save hackathon'}
                        >
                          {hackathon.isSaved ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-purple-900/50 text-purple-300 rounded-full">
                        {hackathon.platform}
                      </span>
                      {hackathon.prize_amount && (
                        <span className="text-xs px-2 py-1 bg-green-900/50 text-green-300 rounded-full font-medium">
                          {formatPrize(hackathon.prize_amount)}
                        </span>
                      )}
                      {daysUntilStart !== null && daysUntilStart >= 0 && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
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

                    <div className="text-xs text-gray-400 mb-2">
                      {hackathon.start_date && (
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(hackathon.start_date)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        {hackathon.is_virtual ? (
                          <>
                            <Globe className="w-3 h-3" />
                            <span>Virtual</span>
                          </>
                        ) : hackathon.location ? (
                          <>
                            <MapPin className="w-3 h-3" />
                            <span>{hackathon.location}</span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {hackathon.hasReminder && (
                          <Bell className="w-3 h-3 text-green-400" title="Reminder set" />
                        )}
                        {hackathon.tags.length > 0 && (
                          <div className="flex gap-1">
                            {hackathon.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="text-xs px-1 py-0.5 bg-gray-800 text-gray-400 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {hackathon.tags.length > 2 && (
                              <span className="text-xs text-gray-500">+{hackathon.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {hackathon.url && (
                        <a
                          href={hackathon.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {hackathons.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <Link
            to="/hackathons"
            className="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Explore More Hackathons
          </Link>
        </div>
      )}
    </div>
  )
}