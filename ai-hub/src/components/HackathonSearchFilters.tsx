import React from 'react'
import { Search, Filter, X } from 'lucide-react'

interface SearchFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedPlatforms: string[]
  setSelectedPlatforms: (platforms: string[]) => void
  selectedLocations: string[]
  setSelectedLocations: (locations: string[]) => void
  selectedPrizeRange: { label: string; min: number; max: number }
  setSelectedPrizeRange: (range: { label: string; min: number; max: number }) => void
  dateFilter: 'upcoming' | 'this_month' | 'next_3_months' | 'all'
  setDateFilter: (filter: 'upcoming' | 'this_month' | 'next_3_months' | 'all') => void
  sortBy: 'date' | 'prize' | 'name'
  setSortBy: (sort: 'date' | 'prize' | 'name') => void
  showOnlyFavorites: boolean
  setShowOnlyFavorites: (show: boolean) => void
  showOnlySaved: boolean
  setShowOnlySaved: (show: boolean) => void
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

export function HackathonSearchFilters({
  searchTerm,
  setSearchTerm,
  selectedPlatforms,
  setSelectedPlatforms,
  selectedLocations,
  setSelectedLocations,
  selectedPrizeRange,
  setSelectedPrizeRange,
  dateFilter,
  setDateFilter,
  sortBy,
  setSortBy,
  showOnlyFavorites,
  setShowOnlyFavorites,
  showOnlySaved,
  setShowOnlySaved
}: SearchFiltersProps) {
  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedPlatforms([])
    setSelectedLocations([])
    setSelectedPrizeRange(PRIZE_RANGES[0])
    setDateFilter('upcoming')
    setSortBy('date')
    setShowOnlyFavorites(false)
    setShowOnlySaved(false)
  }

  const hasActiveFilters = 
    searchTerm.length > 0 ||
    selectedPlatforms.length > 0 ||
    selectedLocations.length > 0 ||
    selectedPrizeRange.min > 0 ||
    dateFilter !== 'upcoming' ||
    sortBy !== 'date' ||
    showOnlyFavorites ||
    showOnlySaved

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Search & Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Search and Primary Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
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
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Time Period</label>
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
          <label className="block text-sm font-medium text-gray-300 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Start Date</option>
            <option value="prize">Prize Amount</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Prize Range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Prize Range</label>
          <div className="flex flex-wrap gap-1">
            {PRIZE_RANGES.map((range) => (
              <button
                key={range.label}
                onClick={() => setSelectedPrizeRange(range)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  selectedPrizeRange.label === range.label
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Platforms */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Platforms</label>
          <div className="flex flex-wrap gap-1">
            {PLATFORMS.map((platform) => (
              <button
                key={platform}
                onClick={() => {
                  setSelectedPlatforms(prev =>
                    prev.includes(platform)
                      ? prev.filter(p => p !== platform)
                      : [...prev, platform]
                  )
                }}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
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

        {/* Locations */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Locations</label>
          <div className="flex flex-wrap gap-1">
            {LOCATIONS.map((location) => (
              <button
                key={location}
                onClick={() => {
                  setSelectedLocations(prev =>
                    prev.includes(location)
                      ? prev.filter(l => l !== location)
                      : [...prev, location]
                  )
                }}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  selectedLocations.includes(location)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {location}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toggle Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            showOnlyFavorites
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          ❤️ Favorites Only
        </button>

        <button
          onClick={() => setShowOnlySaved(!showOnlySaved)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            showOnlySaved
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          📖 Saved Only
        </button>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Active filters:</span>
            {searchTerm && (
              <span className="px-2 py-1 bg-gray-800 rounded text-xs">
                Search: "{searchTerm}"
              </span>
            )}
            {selectedPlatforms.length > 0 && (
              <span className="px-2 py-1 bg-purple-800 rounded text-xs">
                {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''}
              </span>
            )}
            {selectedLocations.length > 0 && (
              <span className="px-2 py-1 bg-blue-800 rounded text-xs">
                {selectedLocations.length} location{selectedLocations.length !== 1 ? 's' : ''}
              </span>
            )}
            {selectedPrizeRange.min > 0 && (
              <span className="px-2 py-1 bg-green-800 rounded text-xs">
                {selectedPrizeRange.label}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}