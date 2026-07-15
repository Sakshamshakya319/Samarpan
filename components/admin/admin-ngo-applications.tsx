"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
  ExternalLink
} from "lucide-react"
import type { NGORegistration } from "@/lib/models/ngo"

interface AdminNGOApplicationsProps {
  token: string
}

export function AdminNGOApplications({ token }: AdminNGOApplicationsProps) {
  const [applications, setApplications] = useState<NGORegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedApp, setSelectedApp] = useState<NGORegistration | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/admin/ngo-applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications)
      } else {
        setError('Failed to fetch NGO applications')
      }
    } catch (err) {
      setError('Error fetching applications')
    } finally {
      setIsLoading(false)
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
        setSuccess(`NGO application ${action}d successfully`)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">NGO Applications</h2>
          <p className="text-gray-600">Review and manage NGO registration applications</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {applications.length} Total Applications
        </Badge>
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

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications</h3>
            <p className="text-gray-600">No NGO applications have been submitted yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {applications.map((app) => (
            <Card key={app._id} className="shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{app.ngoName}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {app.city}, {app.state}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(app.createdAt.toString())}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(app.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedApp(selectedApp?._id === app._id ? null : app)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {selectedApp?._id === app._id ? 'Hide' : 'View'} Details
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {selectedApp?._id === app._id && (
                <CardContent className="border-t bg-gray-50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
                    
                    {/* Basic Information */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Registration Number:</span>
                            <span className="font-medium">{app.registrationNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span className="font-medium capitalize">{app.registrationType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Established:</span>
                            <span className="font-medium">{app.yearOfEstablishment}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pincode:</span>
                            <span className="font-medium">{app.pincode}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{app.ngoEmail}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{app.ngoPhone}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <span>{app.fullAddress}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Authorized Person</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{app.contactPerson.name} ({app.contactPerson.role})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{app.contactPerson.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{app.contactPerson.mobile}</span>
                          </div>
                        </div>
                      </div>

                      {/* Optional Information */}
                      {(app.website || app.facebookPage || app.instagramPage || app.googleMapsLink) && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Online Presence</h4>
                          <div className="space-y-2 text-sm">
                            {app.website && (
                              <div className="flex items-center gap-2">
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                                <a href={app.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  Website
                                </a>
                              </div>
                            )}
                            {app.facebookPage && (
                              <div className="flex items-center gap-2">
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                                <a href={app.facebookPage} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  Facebook
                                </a>
                              </div>
                            )}
                            {app.instagramPage && (
                              <div className="flex items-center gap-2">
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                                <a href={app.instagramPage} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  Instagram
                                </a>
                              </div>
                            )}
                            {app.googleMapsLink && (
                              <div className="flex items-center gap-2">
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                                <a href={app.googleMapsLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  Google Maps
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Documents */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Uploaded Documents</h4>
                        <div className="space-y-2">
                          {Object.entries(app.documents).map(([key, path]) => {
                            if (!path) return null
                            
                            const documentNames: Record<string, string> = {
                              registrationCertificate: 'Registration Certificate',
                              bloodBankLicense: 'Blood Bank License',
                              panCard: 'PAN Card',
                              addressProof: 'Address Proof',
                              certificate80G: '80G Certificate',
                              certificate12A: '12A Certificate'
                            }

                            return (
                              <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium">{documentNames[key] || key}</span>
                                </div>
                                <a
                                  href={path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                  View
                                </a>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      {app.status === 'pending' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Rejection Reason (if rejecting)
                            </label>
                            <Textarea
                              placeholder="Provide reason for rejection..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              rows={3}
                            />
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleAction(app._id!, 'approve')}
                              disabled={actionLoading === app._id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {actionLoading === app._id ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Approve
                            </Button>

                            <Button
                              variant="destructive"
                              onClick={() => handleAction(app._id!, 'reject')}
                              disabled={actionLoading === app._id}
                            >
                              {actionLoading === app._id ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                              )}
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Review Information */}
                      {app.status !== 'pending' && (
                        <div className="bg-white p-4 rounded-lg border">
                          <h4 className="font-semibold text-gray-900 mb-2">Review Information</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span className="font-medium capitalize">{app.status}</span>
                            </div>
                            {app.reviewedAt && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Reviewed:</span>
                                <span className="font-medium">{formatDate(app.reviewedAt.toString())}</span>
                              </div>
                            )}
                            {app.rejectionReason && (
                              <div className="mt-2">
                                <span className="text-gray-600">Reason:</span>
                                <p className="text-red-700 text-sm mt-1">{app.rejectionReason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}