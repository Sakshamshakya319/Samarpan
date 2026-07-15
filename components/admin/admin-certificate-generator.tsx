"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Award, Upload, Loader2, CheckCircle, AlertCircle, Users, FileText, Settings, RefreshCw } from "lucide-react"
import Image from "next/image"

interface User {
  _id: string
  name: string
  email: string
  bloodGroup?: string
  location?: string
  phone?: string
  createdAt?: string
  lastDonationDate?: string
  totalDonations?: number
  hasDisease?: boolean
  diseaseDescription?: string
}

interface DonationHistory {
  _id: string
  userId: string
  userName: string
  userEmail: string
  bloodGroup: string
  quantity: number
  donationDate: string
  donationType: "request" | "direct" | "event"
  status: string
  notes?: string
}

interface DonationRequest {
  _id: string
  bloodType: string
  quantity: number
  urgency: string
  reason: string
  status: string
  createdAt: string
  requesterName?: string
  hospitalLocation?: string
}

interface AdminCertificateGeneratorProps {
  users: User[]
  token: string
}

export function AdminCertificateGenerator({ users, token }: AdminCertificateGeneratorProps) {
  const [selectedUserId, setSelectedUserId] = useState("")
  const [donationCount, setDonationCount] = useState("")
  const [certificateImage, setCertificateImage] = useState<string | null>(null)
  const [certificateImagePreview, setCertificateImagePreview] = useState<string | null>(null)
  const [signatureImage, setSignatureImage] = useState<string | null>(null)
  const [signatureImagePreview, setSignatureImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [donationHistory, setDonationHistory] = useState<DonationHistory[]>([])
  const [donationRequests, setDonationRequests] = useState<DonationRequest[]>([])
  const [fetchingData, setFetchingData] = useState(false)

  useEffect(() => {
    fetchBloodData()
  }, [token])

  const fetchBloodData = async () => {
    if (!token) return
    setFetchingData(true)
    try {
      // Fetch blood donation history
      const historyResponse = await fetch("/api/admin/blood-history", {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setDonationHistory(historyData.donations || [])
      }

      // Fetch active blood requests
      const requestsResponse = await fetch("/api/blood-request?all=true", {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        setDonationRequests(requestsData.requests || [])
      }
    } catch (err) {
      console.error("Error fetching blood data:", err)
    } finally {
      setFetchingData(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isSignature: boolean = false) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file")
        return
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size must be less than 2MB")
        return
      }

      // Convert to base64
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target?.result as string
        if (isSignature) {
          setSignatureImage(base64String)
          setSignatureImagePreview(base64String)
        } else {
          setCertificateImage(base64String)
          setCertificateImagePreview(base64String)
        }
        setError("")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerateCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    if (!selectedUserId || !donationCount) {
      setError("Please select a user and enter donation count")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          donationCount: Number.parseInt(donationCount),
          ...(certificateImage && { imageData: certificateImage }),
          ...(signatureImage && { signatureData: signatureImage }),
        }),
      })

      if (response.ok) {
        setSuccess("Certificate generated and notification sent to user!")
        setSelectedUserId("")
        setDonationCount("")
        setCertificateImage(null)
        setCertificateImagePreview(null)
        setSignatureImage(null)
        setSignatureImagePreview(null)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to generate certificate")
      }
    } catch (err) {
      setError("Error generating certificate")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedUser = users.find(user => user._id === selectedUserId)
  
  // Calculate user's actual donation count from history
  const getUserDonationCount = (userId: string) => {
    return donationHistory.filter(donation => donation.userId === userId).length
  }

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gray-50">
      <div className="w-full max-w-5xl p-4 sm:p-6 lg:p-8">
        
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border mb-8 p-6 sm:p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Generate Certificate</h1>
          <p className="text-muted-foreground text-base sm:text-lg">Create and send modern landscape certificates with verification QR codes to donors</p>
        </div>

        <form onSubmit={handleGenerateCertificate} className="space-y-6 sm:space-y-8">
            
          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg shadow-sm">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-red-800 font-semibold text-base">Error</h3>
                  <p className="text-red-700 mt-1 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg shadow-sm">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-green-800 font-semibold text-base">Success</h3>
                  <p className="text-green-700 mt-1 text-sm">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* User Selection Card */}
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Select Recipient</h2>
              </div>
              {selectedUser && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 text-sm w-fit">
                  {selectedUser.name} - {selectedUser.bloodGroup || "Unknown"} - {getUserDonationCount(selectedUser._id)} donations
                </Badge>
              )}
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Choose a user...</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email}) - {user.bloodGroup || "Unknown"} - {getUserDonationCount(user._id)} actual donations
                    </option>
                  ))}
                </select>
              </div>

              {/* Blood Donation History and Active Requests */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Blood Donation Activity</label>
                  <div className="flex items-center gap-2">
                    {fetchingData && <Loader2 className="w-4 h-4 animate-spin" />}
                    <button
                      type="button"
                      onClick={fetchBloodData}
                      disabled={fetchingData}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Refresh
                    </button>
                  </div>
                </div>
                
                {/* Recent Blood Donations */}
                {donationHistory.length > 0 ? (
                  <div className="mb-4">
                    <div className="p-4 border rounded-lg bg-green-50">
                      <p className="text-sm text-green-900 font-medium mb-3">
                        Recent Blood Donations ({donationHistory.length} total):
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-32 overflow-y-auto">
                        {donationHistory.slice(0, 6).map((donation) => (
                          <div key={donation._id} className="text-sm p-3 bg-white border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-green-900">{donation.userName}</span>
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                {donation.bloodGroup}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mt-1">{donation.quantity} unit(s) - {donation.donationType}</p>
                            <p className="text-gray-500 text-xs mt-1">
                              {new Date(donation.donationDate).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                      {donationHistory.length > 6 && (
                        <p className="text-xs text-green-700 mt-2 text-center">
                          And {donationHistory.length - 6} more donations...
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Active Blood Requests */}
                {donationRequests.length > 0 ? (
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <p className="text-sm text-blue-900 font-medium mb-3">
                      Active Blood Requests ({donationRequests.length} pending):
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-32 overflow-y-auto">
                      {donationRequests.slice(0, 4).map((req) => (
                        <div key={req._id} className="text-sm p-3 bg-white border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-blue-900">{req.bloodType}</span>
                            <Badge variant={req.urgency === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                              {req.urgency}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mt-1">{req.quantity} units needed</p>
                          <p className="text-gray-500 text-xs mt-1">{req.reason}</p>
                          {req.hospitalLocation && (
                            <p className="text-gray-500 text-xs">📍 {req.hospitalLocation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    {donationRequests.length > 4 && (
                      <p className="text-xs text-blue-700 mt-2 text-center">
                        And {donationRequests.length - 4} more requests...
                      </p>
                    )}
                  </div>
                ) : donationHistory.length === 0 ? (
                  <div className="p-6 border rounded-lg bg-gray-50 text-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Award className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium mb-1">No Blood Activity Found</p>
                    <p className="text-xs text-gray-400">
                      No completed blood donations or active blood requests at this moment.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      You can still generate certificates for users based on their total donation count.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg bg-yellow-50">
                    <p className="text-sm text-yellow-800 font-medium mb-1">
                      ✅ {donationHistory.length} donations completed, but no active requests
                    </p>
                    <p className="text-xs text-yellow-700">
                      All current blood requests have been fulfilled or expired.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Certificate Details Card */}
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Certificate Details</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="donationCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Donations <span className="text-red-500">*</span>
                </label>
                <Input
                  id="donationCount"
                  type="number"
                  min="1"
                  placeholder={selectedUserId ? `Suggested: ${getUserDonationCount(selectedUserId)}` : "e.g., 5"}
                  value={donationCount}
                  onChange={(e) => setDonationCount(e.target.value)}
                  className="w-full"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">Enter the total number of blood donations made by this user</p>
                  {selectedUserId && (
                    <button
                      type="button"
                      onClick={() => setDonationCount(getUserDonationCount(selectedUserId).toString())}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Use actual count ({getUserDonationCount(selectedUserId)})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Customization Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Certificate Logo */}
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Certificate Logo</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="certificateImage" className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Logo (Optional)
                  </label>
                  <Input
                    id="certificateImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max file size: 2MB. Recommended: PNG or JPG</p>
                </div>
                
                {certificateImagePreview && (
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="text-sm text-gray-600 mb-2">Logo Preview:</div>
                    <Image
                      src={certificateImagePreview}
                      alt="Certificate logo preview"
                      width={256}
                      height={64}
                      className="h-16 w-auto object-contain mx-auto"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCertificateImage(null)
                        setCertificateImagePreview(null)
                      }}
                      className="mt-3 w-full text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove Logo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Authorized Signature */}
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Authorized Signature</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="signatureImage" className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Signature/Seal (Optional)
                  </label>
                  <Input
                    id="signatureImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload authorized signature or official seal</p>
                </div>
                
                {signatureImagePreview && (
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="text-sm text-gray-600 mb-2">Signature Preview:</div>
                    <Image
                      src={signatureImagePreview}
                      alt="Authorized signature preview"
                      width={192}
                      height={48}
                      className="h-12 w-auto object-contain mx-auto"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSignatureImage(null)
                        setSignatureImagePreview(null)
                      }}
                      className="mt-3 w-full text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove Signature
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Certificate Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
            <h3 className="font-semibold text-blue-900 mb-4 text-base sm:text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Certificate Format Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900 text-sm">Modern Landscape Format</p>
                    <p className="text-blue-700 text-xs">A4 size (11" x 8.5") landscape orientation</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900 text-sm">Professional Design</p>
                    <p className="text-blue-700 text-xs">Modern blue color scheme with elegant styling</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900 text-sm">QR Code Verification</p>
                    <p className="text-blue-700 text-xs">Auto-generated QR code for easy verification</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900 text-sm">Unique Verification</p>
                    <p className="text-blue-700 text-xs">Each certificate has a unique verification token</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end pt-2">
            <Button 
              type="submit" 
              className="w-full sm:w-auto px-6 sm:px-8 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm" 
              disabled={isLoading || !selectedUserId || !donationCount}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Certificate...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Generate Certificate
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
