import React from 'react'
import { HackathonWidget } from './HackathonWidget'
import { Bookmark } from 'lucide-react'

interface SavedHackathonsWidgetProps {
  limit?: number
  className?: string
}

export function SavedHackathonsWidget({ 
  limit = 3,
  className = ""
}: SavedHackathonsWidgetProps) {
  return (
    <HackathonWidget
      showSavedOnly={true}
      limit={limit}
      title="Saved Hackathons"
      className={className}
    />
  )
}