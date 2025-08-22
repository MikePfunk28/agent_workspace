import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Bell, Calendar, Clock, X, Check } from 'lucide-react'

interface Reminder {
  id: string
  hackathon_id: string
  hackathon_name: string
  hackathon_start_date: string
  reminder_date: string
  hackathon_url?: string
}

interface HackathonReminderSystemProps {
  className?: string
}

export function HackathonReminderSystem({ className = "" }: HackathonReminderSystemProps) {
  const { user } = useAuth()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('user_hackathons')
        .select(`
          id,
          hackathon_id,
          reminder_date,
          hackathons (
            name,
            start_date,
            url
          )
        `)
        .eq('user_id', user?.id)
        .eq('reminder_set', true)
        .not('reminder_date', 'is', null)
        .order('reminder_date', { ascending: true })

      if (error) throw error

      const formattedReminders: Reminder[] = (data || []).map(item => ({
        id: item.id,
        hackathon_id: item.hackathon_id,
        hackathon_name: item.hackathons?.name || 'Unknown Hackathon',
        hackathon_start_date: item.hackathons?.start_date || '',
        reminder_date: item.reminder_date || '',
        hackathon_url: item.hackathons?.url
      }))

      setReminders(formattedReminders)

      // Filter upcoming reminders (within next 7 days)
      const now = new Date()
      const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000))
      
      const upcoming = formattedReminders.filter(reminder => {
        const reminderDate = new Date(reminder.reminder_date)
        return reminderDate >= now && reminderDate <= sevenDaysFromNow
      })

      setUpcomingReminders(upcoming)
    } catch (error) {
      console.error('Error fetching reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('user_hackathons')
        .update({ reminder_set: false, reminder_date: null })
        .eq('id', reminderId)

      if (error) throw error

      setReminders(prev => prev.filter(r => r.id !== reminderId))
      setUpcomingReminders(prev => prev.filter(r => r.id !== reminderId))
    } catch (error) {
      console.error('Error dismissing reminder:', error)
    }
  }

  const snoozeReminder = async (reminderId: string, days: number) => {
    try {
      const newReminderDate = new Date()
      newReminderDate.setDate(newReminderDate.getDate() + days)

      const { error } = await supabase
        .from('user_hackathons')
        .update({ reminder_date: newReminderDate.toISOString() })
        .eq('id', reminderId)

      if (error) throw error

      await fetchReminders()
    } catch (error) {
      console.error('Error snoozing reminder:', error)
    }
  }

  useEffect(() => {
    fetchReminders()
  }, [user?.id])

  const formatReminderDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 0) return 'Overdue'
    if (diffDays <= 7) return `In ${diffDays} days`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const formatHackathonDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Hackathon Reminders</h3>
        </div>
        <div className="space-y-3">
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

  if (reminders.length === 0) {
    return (
      <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Hackathon Reminders</h3>
        </div>
        <div className="text-center py-6">
          <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No reminders set</p>
          <p className="text-gray-600 text-xs mt-1">
            Save hackathons and set reminders to never miss a deadline!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Hackathon Reminders</h3>
          {upcomingReminders.length > 0 && (
            <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">
              {upcomingReminders.length}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* Upcoming/Due Reminders */}
        {upcomingReminders.map((reminder) => {
          const isOverdue = new Date(reminder.reminder_date) < new Date()
          
          return (
            <div 
              key={`upcoming-${reminder.id}`}
              className={`p-3 rounded-lg border ${
                isOverdue 
                  ? 'bg-red-900/20 border-red-800' 
                  : 'bg-yellow-900/20 border-yellow-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-1">
                    {reminder.hackathon_name}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                    <div className="flex items-center gap-1">
                      <Bell className="w-3 h-3" />
                      <span className={isOverdue ? 'text-red-400' : 'text-yellow-400'}>
                        {formatReminderDate(reminder.reminder_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Starts {formatHackathonDate(reminder.hackathon_start_date)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => snoozeReminder(reminder.id, 1)}
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded transition-colors"
                    >
                      Snooze 1d
                    </button>
                    <button
                      onClick={() => snoozeReminder(reminder.id, 7)}
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded transition-colors"
                    >
                      Snooze 1w
                    </button>
                    {reminder.hackathon_url && (
                      <a
                        href={reminder.hackathon_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                      >
                        View Hackathon
                      </a>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => dismissReminder(reminder.id)}
                  className="p-1 text-gray-500 hover:text-red-400 transition-colors ml-2"
                  title="Dismiss reminder"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}

        {/* Other Reminders */}
        {reminders
          .filter(r => !upcomingReminders.find(ur => ur.id === r.id))
          .slice(0, 5)
          .map((reminder) => (
          <div key={reminder.id} className="flex items-start justify-between p-3 bg-gray-800/50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-white text-sm mb-1">
                {reminder.hackathon_name}
              </h4>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  <span>Remind {formatReminderDate(reminder.reminder_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatHackathonDate(reminder.hackathon_start_date)}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => dismissReminder(reminder.id)}
              className="p-1 text-gray-500 hover:text-red-400 transition-colors"
              title="Cancel reminder"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {reminders.length > 5 && (
        <div className="mt-3 text-center">
          <span className="text-xs text-gray-500">
            and {reminders.length - 5} more reminders
          </span>
        </div>
      )}
    </div>
  )
}