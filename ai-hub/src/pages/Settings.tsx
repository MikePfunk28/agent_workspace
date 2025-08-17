import React, { useState } from 'react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database,
  Mail,
  Globe,
  Key,
  Save
} from 'lucide-react'

export function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [emailNotifications, setEmailNotifications] = useState({
    daily: true,
    weekly: true,
    research: false,
    market: true
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data & Export', icon: Database },
  ]

  const handleSaveProfile = () => {
    // Save profile logic would go here
    console.log('Saving profile...')
  }

  const handleNotificationChange = (type: string, value: boolean) => {
    setEmailNotifications(prev => ({
      ...prev,
      [type]: value
    }))
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.user_metadata?.full_name || ''}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    disabled
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Organization
                  </label>
                  <input
                    type="text"
                    placeholder="Your organization"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role
                  </label>
                  <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                    <option value="researcher">Researcher</option>
                    <option value="developer">Developer</option>
                    <option value="student">Student</option>
                    <option value="entrepreneur">Entrepreneur</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleSaveProfile}
                className="mt-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Email Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Daily AI Digest</div>
                    <div className="text-gray-400 text-sm">Receive daily summaries of AI news and research</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications.daily}
                      onChange={(e) => handleNotificationChange('daily', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Weekly Intelligence Report</div>
                    <div className="text-gray-400 text-sm">Comprehensive weekly analysis and insights</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications.weekly}
                      onChange={(e) => handleNotificationChange('weekly', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Research Alerts</div>
                    <div className="text-gray-400 text-sm">Notifications for new papers in your areas of interest</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications.research}
                      onChange={(e) => handleNotificationChange('research', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Market Updates</div>
                    <div className="text-gray-400 text-sm">Stock alerts and funding news</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications.market}
                      onChange={(e) => handleNotificationChange('market', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Privacy & Security</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="text-white font-medium">Data Encryption</span>
                  </div>
                  <p className="text-gray-400 text-sm">All your data is encrypted using industry-standard AES-256 encryption.</p>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Key className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">Two-Factor Authentication</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Add an extra layer of security to your account.</p>
                  <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                    Enable 2FA
                  </button>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-medium">Data Sharing</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Control how your data is used to improve our services.</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded bg-gray-700 border-gray-600" />
                      <span className="text-gray-300 text-sm">Allow anonymous usage analytics</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded bg-gray-700 border-gray-600" />
                      <span className="text-gray-300 text-sm">Participate in product research</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Appearance & Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-800 border-2 border-blue-500 rounded-lg cursor-pointer">
                      <div className="w-full h-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded mb-2" />
                      <div className="text-white font-medium text-sm">Dark (Current)</div>
                    </div>
                    <div className="p-4 bg-gray-800 border-2 border-gray-700 rounded-lg cursor-pointer opacity-50">
                      <div className="w-full h-20 bg-gradient-to-br from-gray-100 to-white rounded mb-2" />
                      <div className="text-gray-400 font-medium text-sm">Light (Coming Soon)</div>
                    </div>
                    <div className="p-4 bg-gray-800 border-2 border-gray-700 rounded-lg cursor-pointer opacity-50">
                      <div className="w-full h-20 bg-gradient-to-br from-blue-900 to-purple-900 rounded mb-2" />
                      <div className="text-gray-400 font-medium text-sm">Auto (Coming Soon)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'data':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Data Management</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Database className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">Export Your Data</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Download all your projects, research, and preferences.</p>
                  <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                    Request Export
                  </button>
                </div>

                <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-red-400" />
                    <span className="text-red-300 font-medium">Delete Account</span>
                  </div>
                  <p className="text-red-200 text-sm mb-3">Permanently delete your account and all associated data.</p>
                  <button className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">
            Manage your account preferences and data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}