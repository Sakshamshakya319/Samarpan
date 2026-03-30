"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Building, 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileText, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar,
  User,
  Loader2,
  AlertCircle,
  ExternalLink,
  X,
  Download,
  Globe,
  Facebook,
  Instagram,
  MapIcon,
  Pause,
  Play,
  Shield,
  ShieldAlert
} from "lucide-react"
import type { NGORegistration } from "@/lib/models/ngo"

interface AdminNGOApplicationsManagerProps {
  token: string
}

export function AdminNGOApplicationsManager({ token }: AdminNGOApplicationsManagerProps) {
  const [applications, setApplications] = useState<NGORegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedApp, setSelectedApp] = useState<NGORegistration | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [pauseReason, setPauseReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [currentPdfUrl, setCurrentPdfUrl] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')
  const [currentPdfTitle, setCurrentPdfTitle] = useState('')
  const [pdfLoadError, setPdfLoadError] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setError('')
      console.log('Fetching NGO applications...')
      
      const response = await fetch('/api/admin/ngo-applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Applications data:', data)
        setApplications(data.applications || [])
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        setError(`Failed to fetch NGO applications: ${errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Network error while fetching applications')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePauseResume = async (ngoId: string, action: 'pause' | 'resume') => {
    if (action === 'pause' && !pauseReason.trim()) {
      setError('Please provide a reason for pausing the NGO')
      return
    }

    setActionLoading(ngoId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/ngo-pause-resume', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ngoId,
          action,
          reason: action === 'pause' ? pauseReason : undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(`NGO ${action}d successfully! Email notification sent automatically.`)
        setPauseReason('')
        setSelectedApp(null)
        await fetchApplications() // Refresh the list
      } else {
        const errorData = await response.json()
        setError(errorData.error || `Failed to ${action} NGO`)
      }
    } catch (err) {
      setError(`Error ${action}ing NGO`)
    } finally {
      setActionLoading(null)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedApp || !newPassword) return

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setIsChangingPassword(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/ngos/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ngoId: selectedApp._id,
          newPassword
        })
      })

      if (response.ok) {
        setSuccess('Password changed successfully')
        setNewPassword('')
        setShowPasswordChange(false)
        setSelectedApp(null)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to change password')
      }
    } catch (err) {
      setError('Error changing password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleAction = async (ngoId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason.trim()) {
      setError('Please provide a rejection reason')
      return
    }

    setActionLoading(ngoId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/ngo-applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ngoId,
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined
        })
      })

      if (response.ok) {
        setSuccess(`NGO application ${action}d successfully! ${action === 'approve' ? 'Welcome' : 'Notification'} email sent automatically.`)
        setRejectionReason('')
        setSelectedApp(null)
        await fetchApplications() // Refresh the list
      } else {
        const errorData = await response.json()
        setError(errorData.error || `Failed to ${action} application`)
      }
    } catch (err) {
      setError(`Error ${action}ing application`)
    } finally {
      setActionLoading(null)
    }
  }

  const openPdfViewer = async (url: string, title: string) => {
    console.log('Opening PDF viewer for:', url, title)
    
    // Reset states
    setPdfLoadError(false)
    setCurrentPdfUrl('')
    setDownloadUrl('')
    setCurrentPdfTitle(title)
    setPdfViewerOpen(true)
    
    // Construct proxy URL
    const proxyUrl = `/api/admin/view-pdf?path=${encodeURIComponent(url)}&token=${encodeURIComponent(token)}`
    setDownloadUrl(proxyUrl)
    
    try {
      // Fetch as blob to bypass IDM interception
      const response = await fetch(proxyUrl)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      setCurrentPdfUrl(objectUrl)
      console.log('PDF loaded as blob:', objectUrl)
    } catch (error) {
      console.error('PDF fetch error:', error)
      setPdfLoadError(true)
    }
  }

  const closePdfViewer = () => {
    if (currentPdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentPdfUrl)
    }
    setPdfViewerOpen(false)
    setCurrentPdfUrl('')
    setDownloadUrl('')
    setCurrentPdfTitle('')
    setPdfLoadError(false)
  }

  const getStatusBadge = (status: string, isPaused?: boolean) => {
    if (isPaused) {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">⏸️ Paused</Badge>
    }
    
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">⏳ Pending Review</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">✅ Approved</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">❌ Rejected</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredApplications = applications.filter(app => {
    if (filterStatus === 'all') return true
    return app.status === filterStatus
  })

  const getStatusCounts = () => {
    return {
      all: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      approved: applications.filter(app => app.status === 'approved').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
    }
  }

  const statusCounts = getStatusCounts()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading NGO applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Mobile-first layout */}
        <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
          {/* Refresh Button */}
          <Button
            variant="outline"
            onClick={() => {
              setIsLoading(true)
              fetchApplications()
            }}
            disabled={isLoading}
            className="gap-2 w-full xs:w-auto h-9 px-3 text-sm sm:h-10 sm:px-4 sm:text-base"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            <span className="hidden xs:inline">Refresh</span>
          </Button>
        </div>
        
        {/* Status Filter - Full width on mobile */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3 sm:flex-wrap">
          {[
            { key: 'all', label: 'All', count: statusCounts.all },
            { key: 'pending', label: 'Pending', count: statusCounts.pending },
            { key: 'approved', label: 'Approved', count: statusCounts.approved },
            { key: 'rejected', label: 'Rejected', count: statusCounts.rejected },
          ].map(({ key, label, count }) => (
            <Button
              key={key}
              variant={filterStatus === key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(key as any)}
              className="gap-1 h-9 px-2 text-xs sm:gap-2 sm:h-10 sm:px-3 sm:text-sm flex-1 sm:flex-none"
            >
              {label}
              <Badge variant="secondary" className="ml-1 lg:text-sm">{count}</Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Debug Info (only show if no applications and no error) */}
      {!isLoading && applications.length === 0 && !error && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">No NGO Applications Found</h3>
                <p className="text-blue-800 mb-4">
                  This could mean either no NGOs have registered yet, or there might be a database connection issue.
                </p>
                <div className="space-y-2 text-sm text-blue-700">
                  <p><strong>Troubleshooting steps:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Check if any NGOs have completed the registration process</li>
                    <li>Verify database connection is working</li>
                    <li>Check the browser console for any errors</li>
                    <li>Try refreshing the page</li>
                  </ul>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsLoading(true)
                      fetchApplications()
                    }}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open('/ngo/register', '_blank')}
                    className="gap-2"
                  >
                    <Building className="w-4 h-4" />
                    Test NGO Registration
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/admin/test-ngo-db', {
                          headers: { 'Authorization': `Bearer ${token}` }
                        })
                        const data = await response.json()
                        console.log('Database test result:', data)
                        alert(`Database test: ${data.ngoCount} NGOs found. Check console for details.`)
                      } catch (err) {
                        console.error('Database test failed:', err)
                        alert('Database test failed. Check console for details.')
                      }
                    }}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Test Database
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications List */}
      {filteredApplications.length === 0 && applications.length > 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No {filterStatus} Applications
            </h3>
            <p className="text-gray-600">
              No {filterStatus} NGO applications found.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredApplications.map((app) => (
            <Card key={app._id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex flex-col xs:flex-row items-start gap-3 xs:gap-4">
                    <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-blue-600 rounded-lg xs:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <Building className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base xs:text-lg sm:text-xl lg:text-2xl text-gray-900 break-words leading-tight">{app.ngoName}</CardTitle>
                      <CardDescription className="flex flex-col gap-1 xs:gap-2 mt-1 xs:mt-2 text-xs xs:text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                          <span className="truncate">{app.city}, {app.state}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                          <span className="truncate">Applied: {formatDate(app.createdAt.toString())}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                          <span className="truncate">{app.registrationType.charAt(0).toUpperCase() + app.registrationType.slice(1)}</span>
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 xs:gap-3">
                    <div className="flex justify-center xs:justify-start">
                      {getStatusBadge(app.status, app.isPaused)}
                    </div>
                    
                    {/* Action buttons - responsive layout */}
                    <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
                      {/* Pause/Resume buttons for approved NGOs */}
                      {app.status === 'approved' && (
                        <div className="flex gap-2">
                          {app.isPaused ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePauseResume(app._id!, 'resume')}
                              disabled={actionLoading === app._id}
                              className="gap-1 xs:gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 flex-1 xs:flex-none h-8 px-2 text-xs xs:h-9 xs:px-3 xs:text-sm"
                            >
                              {actionLoading === app._id ? (
                                <Loader2 className="w-3 h-3 xs:w-4 xs:h-4 animate-spin" />
                              ) : (
                                <Play className="w-3 h-3 xs:w-4 xs:h-4" />
                              )}
                              <span>Resume</span>
                            </Button>
                          ) : (
                            <div className="flex gap-2 flex-1 xs:flex-none">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedApp(app)
                                  setShowPasswordChange(true)
                                }}
                                className="gap-1 xs:gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 flex-1 h-8 px-2 text-xs xs:h-9 xs:px-3 xs:text-sm"
                                title="Change Password"
                              >
                                <Lock className="w-3 h-3 xs:w-4 xs:h-4" />
                                <span>Password</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedApp(app)
                                }}
                                disabled={actionLoading === app._id}
                                className="gap-1 xs:gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 flex-1 h-8 px-2 text-xs xs:h-9 xs:px-3 xs:text-sm"
                              >
                                <Pause className="w-3 h-3 xs:w-4 xs:h-4" />
                                <span>Pause</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedApp(selectedApp?._id === app._id ? null : app)}
                        className="gap-1 xs:gap-2 flex-1 xs:flex-none h-8 px-2 text-xs xs:h-9 xs:px-3 xs:text-sm"
                      >
                        <Eye className="w-3 h-3 xs:w-4 xs:h-4" />
                        <span>{selectedApp?._id === app._id ? 'Hide' : 'View'}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {selectedApp?._id === app._id && (
                <CardContent className="border-t bg-gray-50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 py-4 sm:py-6">
                    
                    {/* Basic Information - Column 1 */}
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Building className="w-5 h-5 text-blue-600" />
                          Basic Information
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">Registration Number:</span>
                            <span className="font-semibold text-gray-900">{app.registrationNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">Type:</span>
                            <span className="font-semibold text-gray-900 capitalize">{app.registrationType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">Established:</span>
                            <span className="font-semibold text-gray-900">{app.yearOfEstablishment}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">Pincode:</span>
                            <span className="font-semibold text-gray-900">{app.pincode}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Mail className="w-5 h-5 text-green-600" />
                          Contact Information
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{app.ngoEmail}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{app.ngoPhone}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <span className="font-medium">{app.fullAddress}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <User className="w-5 h-5 text-purple-600" />
                          Authorized Person
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{app.contactPerson.name}</span>
                            <Badge variant="outline" className="text-xs">{app.contactPerson.role}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{app.contactPerson.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{app.contactPerson.mobile}</span>
                          </div>
                        </div>
                      </div>

                      {/* Online Presence */}
                      {(app.website || app.facebookPage || app.instagramPage || app.googleMapsLink) && (
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-indigo-600" />
                            Online Presence
                          </h4>
                          <div className="space-y-3 text-sm">
                            {app.website && (
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-400" />
                                <a href={app.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                  Website
                                </a>
                              </div>
                            )}
                            {app.facebookPage && (
                              <div className="flex items-center gap-2">
                                <Facebook className="w-4 h-4 text-blue-600" />
                                <a href={app.facebookPage} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                  Facebook Page
                                </a>
                              </div>
                            )}
                            {app.instagramPage && (
                              <div className="flex items-center gap-2">
                                <Instagram className="w-4 h-4 text-pink-600" />
                                <a href={app.instagramPage} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                  Instagram Page
                                </a>
                              </div>
                            )}
                            {app.googleMapsLink && (
                              <div className="flex items-center gap-2">
                                <MapIcon className="w-4 h-4 text-red-600" />
                                <a href={app.googleMapsLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                  Google Maps Location
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Documents - Column 2 */}
                    <div className="space-y-6">
                      <div className="bg-white p-6 lg:p-8 rounded-lg shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-4 lg:mb-6 flex items-center gap-2 text-lg lg:text-xl">
                          <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
                          Uploaded Documents
                        </h4>
                        <div className="space-y-3 lg:space-y-4">
                          {Object.entries(app.documents).map(([key, path]) => {
                            if (!path) return null
                            
                            const documentNames: Record<string, { name: string; required: boolean }> = {
                              registrationCertificate: { name: 'Registration Certificate', required: true },
                              bloodBankLicense: { name: 'Blood Bank License', required: true },
                              panCard: { name: 'PAN Card', required: true },
                              addressProof: { name: 'Address Proof', required: true },
                              idProof: { name: 'ID Proof (Authorized Person)', required: true },
                              certificate80G: { name: '80G Certificate', required: false },
                              certificate12A: { name: '12A Certificate', required: false }
                            }

                            const docInfo = documentNames[key] || { name: key, required: false }

                            return (
                              <div key={key} className="flex flex-col p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                                <div className="flex items-start gap-3 mb-3">
                                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-medium text-gray-900 break-words">{docInfo.name}</span>
                                      {docInfo.required && (
                                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 flex-shrink-0">
                                          Required
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2 w-full">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openPdfViewer(path, docInfo.name)}
                                    className="flex-1 gap-2 bg-white hover:bg-gray-50"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    asChild
                                    className="flex-1 gap-2 bg-white hover:bg-gray-50"
                                  >
                                    <a href={path} target="_blank" rel="noopener noreferrer">
                                      <Download className="w-4 h-4" />
                                      Download
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Actions & Review - Column 3 */}
                    <div className="space-y-6">
                      
                      {/* Pause/Resume Section for Approved NGOs */}
                      {app.status === 'approved' && (
                        <div className="bg-white p-6 lg:p-8 rounded-lg shadow-sm border-l-4 border-blue-500">
                          <h4 className="font-bold text-gray-900 mb-4 lg:mb-6 flex items-center gap-2 text-lg lg:text-xl">
                            {app.isPaused ? (
                              <ShieldAlert className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
                            ) : (
                              <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                            )}
                            NGO Status Control
                          </h4>
                          
                          {app.isPaused ? (
                            <div className="space-y-4">
                              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Pause className="w-5 h-5 text-orange-600" />
                                  <span className="font-semibold text-orange-800">NGO is Currently Paused</span>
                                </div>
                                <div className="space-y-2 text-sm text-orange-700">
                                  {app.pausedAt && (
                                    <p><strong>Paused on:</strong> {formatDate(app.pausedAt.toString())}</p>
                                  )}
                                  {app.pauseReason && (
                                    <p><strong>Reason:</strong> {app.pauseReason}</p>
                                  )}
                                </div>
                              </div>
                              
                              <Button
                                onClick={() => handlePauseResume(app._id!, 'resume')}
                                disabled={actionLoading === app._id}
                                className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 lg:h-12 lg:text-base"
                                size="lg"
                              >
                                {actionLoading === app._id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Play className="w-5 h-5" />
                                )}
                                Resume NGO Operations
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Shield className="w-5 h-5 text-green-600" />
                                  <span className="font-semibold text-green-800">NGO is Active</span>
                                </div>
                                <p className="text-sm text-green-700">
                                  This NGO can access all platform features and perform operations.
                                </p>
                              </div>
                              
                              <div>
                                <label className="block text-sm lg:text-base font-medium text-gray-700 mb-2 lg:mb-3">
                                  Reason for Pausing (required)
                                </label>
                                <Textarea
                                  placeholder="Provide detailed reason for pausing this NGO (e.g., Suspicious activity, Policy violation, Under investigation, etc.)"
                                  value={pauseReason}
                                  onChange={(e) => setPauseReason(e.target.value)}
                                  rows={3}
                                  className="w-full lg:text-base lg:p-4"
                                />
                              </div>
                              
                              <Button
                                onClick={() => handlePauseResume(app._id!, 'pause')}
                                disabled={actionLoading === app._id || !pauseReason.trim()}
                                variant="destructive"
                                className="w-full gap-2 lg:h-12 lg:text-base"
                                size="lg"
                              >
                                {actionLoading === app._id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Pause className="w-5 h-5" />
                                )}
                                Pause NGO Operations
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Review Information */}
                      {app.status !== 'pending' && (
                        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                            Review Information
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Status:</span>
                              <span className="font-bold capitalize text-gray-900">{app.status}</span>
                            </div>
                            {app.reviewedAt && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 font-medium">Reviewed:</span>
                                <span className="font-medium text-gray-900">{formatDate(app.reviewedAt.toString())}</span>
                              </div>
                            )}
                            {app.rejectionReason && (
                              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                                <span className="text-red-800 font-medium">Rejection Reason:</span>
                                <p className="text-red-700 text-sm mt-1">{app.rejectionReason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions for Pending Applications */}
                      {app.status === 'pending' && (
                        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                            Review Actions
                          </h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm lg:text-base font-medium text-gray-700 mb-2 lg:mb-3">
                                Rejection Reason (required if rejecting)
                              </label>
                              <Textarea
                                placeholder="Provide detailed reason for rejection (e.g., Invalid documents, Incomplete information, etc.)"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                                className="w-full lg:text-base lg:p-4"
                              />
                            </div>

                            <div className="flex flex-col gap-3 lg:gap-4">
                              <Button
                                onClick={() => handleAction(app._id!, 'approve')}
                                disabled={actionLoading === app._id}
                                className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 lg:h-12 lg:text-base"
                                size="lg"
                              >
                                {actionLoading === app._id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-5 h-5" />
                                )}
                                Approve NGO Application
                              </Button>

                              <Button
                                variant="destructive"
                                onClick={() => handleAction(app._id!, 'reject')}
                                disabled={actionLoading === app._id || !rejectionReason.trim()}
                                className="w-full gap-2 lg:h-12 lg:text-base"
                                size="lg"
                              >
                                {actionLoading === app._id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <XCircle className="w-5 h-5" />
                                )}
                                Reject Application
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Application Stats */}
                      <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-4">Application Stats</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Documents Uploaded:</span>
                            <span className="font-medium">{Object.values(app.documents).filter(doc => doc).length}/7</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Required Documents:</span>
                            <span className="font-medium">5/5 ✓</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Legal Confirmation:</span>
                            <span className="font-medium">{app.legalConfirmation ? '✓ Confirmed' : '✗ Not Confirmed'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* PDF Viewer Dialog */}
      <Dialog open={pdfViewerOpen} onOpenChange={closePdfViewer}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0" aria-describedby={undefined}>
          <DialogHeader className="p-4 border-b bg-white flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-blue-600" />
              {currentPdfTitle}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 relative bg-gray-100">
            {currentPdfUrl && !pdfLoadError && (
                  <div className="w-full h-full relative">
                    <object
                      data={currentPdfUrl}
                      type="application/pdf"
                      className="w-full h-full"
                      style={{ 
                        height: 'calc(90vh - 80px)',
                        minHeight: '600px'
                      }}
                      onLoad={() => {
                        console.log('PDF object loaded successfully')
                        setPdfLoadError(false)
                      }}
                      onError={(e) => {
                        console.error('PDF object failed to load:', e)
                        setPdfLoadError(true)
                      }}
                    >
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
                        <FileText className="w-16 h-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          PDF cannot be displayed directly
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Your browser might not support embedding PDFs. You can download it instead.
                        </p>
                        <Button asChild>
                          <a href={downloadUrl || currentPdfUrl} download>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </a>
                        </Button>
                      </div>
                    </object>
                    
                    {/* Floating action buttons */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white"
                  >
                    <a 
                      href={downloadUrl || currentPdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in New Tab
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white"
                  >
                    <a 
                      href={downloadUrl || currentPdfUrl} 
                      download
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Error fallback */}
            {(pdfLoadError || !currentPdfUrl) && (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {pdfLoadError ? 'Unable to display PDF' : 'Loading PDF...'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {pdfLoadError 
                    ? "The PDF couldn't be loaded in the viewer. You can try opening it in a new tab or downloading it directly."
                    : "Please wait while the PDF is being fetched..."}
                </p>
                {pdfLoadError && (
                  <div className="flex gap-3">
                    <Button asChild className="gap-2">
                      <a 
                        href={downloadUrl || currentPdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open in New Tab
                      </a>
                    </Button>
                    <Button variant="outline" asChild className="gap-2">
                      <a 
                        href={downloadUrl || currentPdfUrl} 
                        download
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordChange} onOpenChange={(open) => {
        setShowPasswordChange(open)
        if (!open) {
          setNewPassword('')
          setError('')
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Change NGO Password
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">New Password for {selectedApp?.ngoName}</label>
              <Input
                type="password"
                placeholder="Enter at least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
                className="h-11"
              />
              <p className="text-xs text-gray-500">
                Tip: Use a strong password with letters, numbers and symbols.
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-100 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordChange(false)}
                disabled={isChangingPassword}
                className="h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isChangingPassword || !newPassword}
                className="bg-blue-600 hover:bg-blue-700 h-11 px-6"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}