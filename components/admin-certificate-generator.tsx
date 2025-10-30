"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Award, Upload, Loader2 } from "lucide-react"

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

interface DonationRequest {
  _id: string
  bloodType: string
  quantity: number
  urgency: string
  reason: string
  status: string
  createdAt: string
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
  const [donationRequests, setDonationRequests] = useState<DonationRequest[]>([])
  const [fetchingRequests, setFetchingRequests] = useState(false)

  useEffect(() => {
    fetchDonationRequests()
  }, [token])

  const fetchDonationRequests = async () => {
    if (!token) return
    setFetchingRequests(true)
    try {
      const response = await fetch("/api/admin/accepted-donations", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setDonationRequests(data.requests || [])
      }
    } catch (err) {
      console.error("Error fetching donation requests:", err)
    } finally {
      setFetchingRequests(false)
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Generate Certificate
        </CardTitle>
        <CardDescription>Create and send certificates to donors</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerateCertificate} className="space-y-4">
          {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}
          {success && <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">{success}</div>}

          <div className="space-y-2">
            <label className="text-sm font-medium">Select User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md"
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Donation Requests</label>
              {fetchingRequests && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
            {donationRequests.length > 0 && (
              <div className="p-2 border rounded-md bg-blue-50">
                <p className="text-xs text-blue-900 font-medium mb-2">Active Blood Requests:</p>
                <div className="space-y-1">
                  {donationRequests.map((req) => (
                    <div key={req._id} className="text-xs p-2 bg-white border border-blue-200 rounded">
                      <span className="font-medium">{req.bloodType}</span> - {req.quantity} units ({req.urgency})
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!fetchingRequests && donationRequests.length === 0 && (
              <p className="text-xs text-gray-500">No active blood donation requests at this moment.</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="donationCount" className="text-sm font-medium">
              Number of Donations
            </label>
            <Input
              id="donationCount"
              type="number"
              min="1"
              placeholder="e.g., 5"
              value={donationCount}
              onChange={(e) => setDonationCount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="certificateImage" className="text-sm font-medium">
              Certificate Logo/Image (Optional)
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="certificateImage"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, false)}
                className="flex-1"
              />
            </div>
            {certificateImagePreview && (
              <div className="mt-2 p-2 border rounded-md bg-gray-50">
                <div className="text-xs text-gray-600 mb-2">Logo Preview:</div>
                <img src={certificateImagePreview} alt="Certificate logo preview" className="h-16 object-contain" />
                <button
                  type="button"
                  onClick={() => {
                    setCertificateImage(null)
                    setCertificateImagePreview(null)
                  }}
                  className="mt-2 text-xs text-red-600 hover:text-red-800"
                >
                  Remove Logo
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500">Max file size: 2MB. Recommended: PNG or JPG</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="signatureImage" className="text-sm font-medium">
              Authorized Signature/Seal (Optional)
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="signatureImage"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, true)}
                className="flex-1"
              />
            </div>
            {signatureImagePreview && (
              <div className="mt-2 p-2 border rounded-md bg-gray-50">
                <div className="text-xs text-gray-600 mb-2">Signature Preview:</div>
                <img src={signatureImagePreview} alt="Authorized signature preview" className="h-12 object-contain" />
                <button
                  type="button"
                  onClick={() => {
                    setSignatureImage(null)
                    setSignatureImagePreview(null)
                  }}
                  className="mt-2 text-xs text-red-600 hover:text-red-800"
                >
                  Remove Signature
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500">Upload authorized signature or official seal to add to certificate</p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate Certificate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
