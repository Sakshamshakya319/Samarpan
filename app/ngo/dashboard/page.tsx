"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building, Users, Calendar, Heart, Settings, LogOut, ExternalLink, CheckCircle, QrCode } from "lucide-react"
import { NGORestrictedDashboard } from "@/components/ngo-restricted-dashboard"
import { NGOEventsManager } from "@/components/ngo-events-manager"
import { NGOVolunteerManager } from "@/components/ngo-volunteer-manager"
import { NgoQRChecker } from "@/components/ngo-qr-checker"

// Simple JWT decoder for client-side use
function decodeJWT(token: string) {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

interface NGOData {
  id: string
  name: string
  email: string
  role: string
  contactPerson: any
  location: string
}

interface DecodedToken {
  ngoId: string
  email: string
  role: string
  ngoName: string
  isPaused?: boolean
  exp: number
}

export default function NGODashboard() {
  const router = useRouter()
  const [ngoData, setNgoData] = useState<NGOData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [pauseDetails, setPauseDetails] = useState<{
    reason?: string
    pausedAt?: string
  }>({})
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    checkNGOStatus()
    
    // Set up periodic status checking every 30 seconds
    const statusInterval = setInterval(() => {
      if (!isLoading) {
        checkNGOStatus()
      }
    }, 30000)

    return () => clearInterval(statusInterval)
  }, [router])

  const checkNGOStatus = async () => {
    // Check if NGO is logged in
    const token = localStorage.getItem('ngoToken')
    const storedNgoData = localStorage.getItem('ngoData')

    console.log('Checking NGO status...', { hasToken: !!token, hasData: !!storedNgoData })

    if (!token || !storedNgoData) {
      router.push('/ngo/login')
      return
    }

    try {
      // First decode token to check if it's expired
      const decoded = decodeJWT(token) as DecodedToken
      
      if (!decoded || decoded.exp * 1000 < Date.now()) {
        // Token expired
        console.log('Token expired, redirecting to login')
        localStorage.removeItem('ngoToken')
        localStorage.removeItem('ngoData')
        localStorage.removeItem('ngoPauseInfo')
        router.push('/ngo/login')
        return
      }

      console.log('Token valid, fetching current status...')

      // Fetch current NGO status from API
      const response = await fetch('/api/ngo/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const statusData = await response.json()
        
        console.log('NGO Status Data:', statusData) // Debug log
        
        if (statusData.isPaused) {
          console.log('NGO is paused, showing restricted dashboard')
          if (!isPaused) {
            setStatusMessage('Your account has been suspended. Please check the details below.')
          }
          setIsPaused(true)
          setPauseDetails({
            reason: statusData.pauseReason,
            pausedAt: statusData.pausedAt
          })
          
          // Store pause info in localStorage for future reference
          localStorage.setItem('ngoPauseInfo', JSON.stringify({
            reason: statusData.pauseReason,
            pausedAt: statusData.pausedAt
          }))
        } else {
          console.log('NGO is active, showing normal dashboard')
          if (isPaused) {
            setStatusMessage('Great! Your account has been reactivated. You can now access all features.')
          }
          setIsPaused(false)
          setPauseDetails({})
          // Clear any stored pause info
          localStorage.removeItem('ngoPauseInfo')
        }
      } else {
        const errorData = await response.json()
        console.error('Status check failed:', errorData)
        
        if (response.status === 401) {
          // Token is invalid, redirect to login
          console.log('Unauthorized, redirecting to login')
          localStorage.removeItem('ngoToken')
          localStorage.removeItem('ngoData')
          localStorage.removeItem('ngoPauseInfo')
          router.push('/ngo/login')
          return
        }
      }

      const parsedNgoData = JSON.parse(storedNgoData)
      setNgoData(parsedNgoData)
    } catch (error) {
      console.error('Error checking NGO status:', error)
      // Don't redirect on network errors, just log them
      const parsedNgoData = JSON.parse(storedNgoData)
      setNgoData(parsedNgoData)
    }

    setIsLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('ngoToken')
    localStorage.removeItem('ngoData')
    localStorage.removeItem('ngoPauseInfo')
    router.push('/ngo/login')
  }

  const refreshStatus = async () => {
    setIsCheckingStatus(true)
    await checkNGOStatus()
    setIsCheckingStatus(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Building className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!ngoData) {
    return null
  }

  // Show restricted dashboard if NGO is paused
  if (isPaused) {
    return (
      <NGORestrictedDashboard
        ngoName={ngoData.name}
        pauseReason={pauseDetails.reason}
        pausedAt={pauseDetails.pausedAt}
        contactEmail="support@samarpan.com"
        onRefresh={refreshStatus}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{ngoData.name}</h1>
                <p className="text-gray-600 text-sm">{ngoData.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Verified NGO
              </Badge>
              {isCheckingStatus && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Checking Status...
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshStatus}
                disabled={isCheckingStatus}
                className="gap-2"
              >
                {isCheckingStatus ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Check Status
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Status Message */}
        {statusMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
              <p className="text-green-700">{statusMessage}</p>
              <button 
                onClick={() => setStatusMessage('')}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "overview"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Building className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "events"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Events Management
          </button>
          <button
            onClick={() => setActiveTab("volunteers")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "volunteers"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users className="w-4 h-4" />
            Volunteer Management
          </button>
          <button
            onClick={() => setActiveTab("scan")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "scan"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR Scanner
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <>
            {/* Welcome Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-2">
                Welcome to your NGO Dashboard! 🎉
              </h2>
              <p className="text-blue-700">
                Your NGO has been successfully verified. You can now start organizing blood donation events and managing donor activities through Samarpan.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-gray-600">Events organized</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-gray-600">Currently active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-gray-600">Volunteer registrations</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Lives Impacted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-gray-600">Estimated impact</p>
                </CardContent>
              </Card>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("events")}>
                <CardHeader>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 text-red-600" />
                  </div>
                  <CardTitle>Organize Events</CardTitle>
                  <CardDescription>
                    Create and manage blood donation events with custom participant categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    Manage Events
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("volunteers")}>
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle>Manage Volunteers</CardTitle>
                  <CardDescription>
                    View volunteer registrations and issue certificates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("volunteers")}>
                    Manage Volunteers
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("volunteers")}>
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <Heart className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle>Issue Certificates</CardTitle>
                  <CardDescription>
                    Generate and send volunteer certificates via email
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setActiveTab("volunteers")}>
                    Issue Certificates
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("scan")}>
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <QrCode className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle>Scan QR Codes</CardTitle>
                  <CardDescription>
                    Verify volunteers and donors at your event venue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("scan")}>
                    Open Scanner
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                    <Settings className="w-6 h-6 text-gray-600" />
                  </div>
                  <CardTitle>NGO Settings</CardTitle>
                  <CardDescription>
                    Update your NGO profile and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Getting Started */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Follow these steps to start making an impact with Samarpan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Create Your First Event</h4>
                      <p className="text-gray-600 text-sm">
                        Go to Events Management and create a blood donation event. Choose the location type and participant categories that match your venue.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Wait for Approval</h4>
                      <p className="text-gray-600 text-sm">
                        Your event will be reviewed by our super admin team. You'll receive an email notification once approved.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Manage Volunteers & Issue Certificates</h4>
                      <p className="text-gray-600 text-sm">
                        View volunteer registrations, manage participants, and issue official certificates to volunteers via email.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Track Impact</h4>
                      <p className="text-gray-600 text-sm">
                        Monitor event registrations, volunteer participation, and the overall impact of your blood donation events.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Events Management Tab */}
        {activeTab === "events" && (
          <div className="space-y-6">
            {localStorage.getItem('ngoToken') && (
              <NGOEventsManager token={localStorage.getItem('ngoToken')!} />
            )}
          </div>
        )}

        {/* Volunteer Management Tab */}
        {activeTab === "volunteers" && (
          <div className="space-y-6">
            {localStorage.getItem('ngoToken') && (
              <NGOVolunteerManager token={localStorage.getItem('ngoToken')!} />
            )}
          </div>
        )}

        {/* QR Scanner Tab */}
        {activeTab === "scan" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-blue-900 mb-2">
                    Event Check-in System
                </h2>
                <p className="text-blue-700">
                    Use this scanner to verify QR codes from both Volunteers and Donors. Ensure you have allowed camera access.
                </p>
            </div>
            {localStorage.getItem('ngoToken') && (
              <NgoQRChecker token={localStorage.getItem('ngoToken')!} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}