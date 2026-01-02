"use client"

import { useEffect, useState } from 'react'
import { Clock, RefreshCw, Calendar, Timer, Wifi, WifiOff } from 'lucide-react'
import { SamarpanLoader } from '@/components/samarpan-loader'

interface MaintenanceSettings {
  enabled: boolean
  message: string
  enabledAt: string
  estimatedDuration?: number
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

export default function MaintenancePage() {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [countdown, setCountdown] = useState(30)
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  // Update current time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timeInterval)
  }, [])

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Fetch maintenance settings
  const fetchMaintenanceSettings = async () => {
    try {
      const response = await fetch('/api/admin/maintenance', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setRetryCount(0)
        
        // If maintenance is disabled, redirect to home
        if (!data.enabled) {
          window.location.href = '/'
          return
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to fetch maintenance settings:', error)
      setRetryCount(prev => prev + 1)
      
      // Fallback settings
      setSettings({
        enabled: true,
        message: 'We are currently performing scheduled maintenance to improve your experience. Please check back shortly.',
        enabledAt: new Date().toISOString(),
        priority: 'medium'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch and setup intervals
  useEffect(() => {
    fetchMaintenanceSettings()

    // Auto-refresh countdown
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchMaintenanceSettings()
          return 30
        }
        return prev - 1
      })
    }, 1000)

    // Periodic check every 2 minutes
    const periodicCheck = setInterval(() => {
      fetchMaintenanceSettings()
    }, 120000)

    return () => {
      clearInterval(countdownInterval)
      clearInterval(periodicCheck)
    }
  }, [])

  // Calculate maintenance duration
  const getMaintenanceDuration = () => {
    if (!settings?.enabledAt) return null
    
    const startTime = new Date(settings.enabledAt)
    const now = new Date()
    const diffMs = now.getTime() - startTime.getTime()
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    return { hours, minutes }
  }

  const duration = getMaintenanceDuration()

  // Priority colors and messages
  const getPriorityConfig = (priority: string = 'medium') => {
    const configs = {
      low: {
        color: 'from-blue-600 to-cyan-600',
        bgColor: 'bg-blue-50/80',
        borderColor: 'border-blue-200/60',
        textColor: 'text-blue-600',
        message: 'Routine maintenance in progress'
      },
      medium: {
        color: 'from-orange-600 to-red-600',
        bgColor: 'bg-orange-50/80',
        borderColor: 'border-orange-200/60',
        textColor: 'text-orange-600',
        message: 'Scheduled maintenance underway'
      },
      high: {
        color: 'from-red-600 to-pink-600',
        bgColor: 'bg-red-50/80',
        borderColor: 'border-red-200/60',
        textColor: 'text-red-600',
        message: 'Important system updates'
      },
      critical: {
        color: 'from-red-700 to-red-900',
        bgColor: 'bg-red-100/80',
        borderColor: 'border-red-300/60',
        textColor: 'text-red-700',
        message: 'Critical maintenance required'
      }
    }
    return configs[priority as keyof typeof configs] || configs.medium
  }

  const priorityConfig = getPriorityConfig(settings?.priority)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <SamarpanLoader size="xl" showText={true} className="text-gray-900" useBloodImage={true} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-100/60 to-orange-100/60 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-100/60 to-purple-100/60 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-orange-100/40 to-red-100/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full text-center space-y-8">
          
          {/* Header with Samarpan loader */}
          <div className="space-y-6">
            <SamarpanLoader size="xl" showText={false} useBloodImage={true} />
            
            <div className="space-y-4">
              <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r ${priorityConfig.color} bg-clip-text text-transparent`}>
                SAMARPAN
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">
                Under Maintenance
              </h2>
              <p className={`text-sm ${priorityConfig.textColor} font-medium`}>
                {priorityConfig.message}
              </p>
            </div>
          </div>

          {/* Maintenance message */}
          <div className={`${priorityConfig.bgColor} backdrop-blur-sm rounded-2xl p-6 md:p-8 border ${priorityConfig.borderColor} max-w-3xl mx-auto shadow-lg`}>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              {settings?.message || 'We are currently performing scheduled maintenance to improve your experience. Please check back shortly.'}
            </p>
          </div>

          {/* Status cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            
            {/* Current time */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold mb-1 text-gray-700">Current Time</h3>
              <p className="text-lg font-mono text-gray-900">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Maintenance started */}
            {settings?.enabledAt && (
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-sm font-semibold mb-1 text-gray-700">Started At</h3>
                <p className="text-sm font-mono text-gray-900">
                  {new Date(settings.enabledAt).toLocaleTimeString('en-US', { 
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(settings.enabledAt).toLocaleDateString('en-US', { 
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {/* Duration */}
            {duration && (
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <Timer className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="text-sm font-semibold mb-1 text-gray-700">Duration</h3>
                <p className="text-lg font-mono text-gray-900">
                  {duration.hours > 0 ? `${duration.hours}h ` : ''}{duration.minutes}m
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  In progress
                </p>
              </div>
            )}

            {/* Auto refresh */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <RefreshCw className={`w-5 h-5 text-purple-600 ${countdown <= 5 ? 'animate-spin' : ''}`} />
              </div>
              <h3 className="text-sm font-semibold mb-1 text-gray-700">Auto Refresh</h3>
              <p className="text-lg font-mono text-gray-900">
                {countdown}s
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Next check
              </p>
            </div>
          </div>

          {/* Connection status */}
          <div className="flex items-center justify-center space-x-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">Offline</span>
              </>
            )}
            {retryCount > 0 && (
              <span className="text-xs text-gray-400 ml-2">
                (Retry {retryCount})
              </span>
            )}
          </div>

          {/* Footer messages */}
          <div className="space-y-4 pt-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 max-w-2xl mx-auto shadow-sm">
              <p className="text-gray-600 text-sm leading-relaxed">
                🔧 We're working hard to improve your experience. Our team is implementing important updates to serve you better.
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-gray-500 text-sm">
                Thank you for your patience. We'll be back online shortly.
              </p>
              <p className="text-gray-400 text-xs">
                This page automatically refreshes every 30 seconds to check if the service is available.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}
      />
    </div>
  )
}