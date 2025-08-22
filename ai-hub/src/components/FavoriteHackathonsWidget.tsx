import React from 'react'
import { HackathonWidget } from './HackathonWidget'
import { Heart } from 'lucide-react'

interface FavoriteHackathonsWidgetProps {
  limit?: number
  className?: string
}

export function FavoriteHackathonsWidget({ 
  limit = 3,
  className = ""
}: FavoriteHackathonsWidgetProps) {
  return (
    <HackathonWidget
      showFavoritesOnly={true}
      limit={limit}
      title="Favorite Hackathons"
      className={className}
    />
  )
}