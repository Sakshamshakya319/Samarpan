"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Award, Download, FileText, Loader2 } from "lucide-react"
import { useAppSelector } from "@/lib/hooks"

interface Certificate {
  _id: string
  certificateId: string
  donationCount: number
  issuedDate: string
  certificateUrl?: string
}

interface VolunteerCertificate {
  _id: string
  certificateId: string
  eventTitle: string
  eventDate: string
  ngoName: string
  issuedDate: string
  userName: string
}

export function UserCertificatesDisplay() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [volunteerCertificates, setVolunteerCertificates] = useState<VolunteerCertificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const { token } = useAppSelector((state) => state.auth)

  useEffect(() => {
    fetchCertificates()
  }, [token])

  const fetchCertificates = async () => {
    if (!token) return
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch("/api/certificates", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setCertificates(data.certificates || [])
        setVolunteerCertificates(data.volunteerCertificates || [])
      } else {
        setError("Failed to fetch certificates")
      }
    } catch (err) {
      console.error("Failed to fetch certificates:", err)
      setError("Error loading certificates")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadCertificate = async (certificateId: string, certificateNumber: string) => {
    if (!token) return
    setDownloadingId(certificateId)
    try {
      // Use query parameter based endpoint which is more reliable
      const response = await fetch(`/api/certificates/generate?id=${certificateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!response.ok) {
         throw new Error("Failed to download")
      }
      
      await downloadBlob(response, `certificate-${certificateNumber}.pdf`)
      setDownloadingId(null)
    } catch (error) {
      console.error("Download error:", error)
      setError("Error downloading certificate")
      setDownloadingId(null)
    }
  }

  const handleDownloadVolunteerCertificate = async (certificateId: string, eventTitle: string) => {
    if (!token) return
    setDownloadingId(certificateId)
    try {
      // Use query parameter based endpoint
      const response = await fetch(`/api/volunteer-certificates/download?id=${certificateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error("Failed to download")
      }

      await downloadBlob(response, `Volunteer-Certificate-${eventTitle.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`)
      setDownloadingId(null)
    } catch (error) {
      console.error("Download error:", error)
      setError("Error downloading certificate")
      setDownloadingId(null)
    }
  }

  const downloadBlob = async (response: Response, filename: string) => {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Your Certificates
          </CardTitle>
          <CardDescription>Recognition of your generous contributions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading certificates...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (certificates.length === 0 && volunteerCertificates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Your Certificates
          </CardTitle>
          <CardDescription>Recognition of your generous contributions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No certificates yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Participate in events or donate blood to earn certificates
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Award className="w-5 h-5 text-yellow-600" />
          Your Certificates
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Recognition of your generous contributions</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">{error}</div>}

        <div className="space-y-6">
          {/* Donation Certificates */}
          {certificates.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Donation Certificates</h3>
              {certificates.map((cert) => (
                <div
                  key={cert._id}
                  className="p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-red-50 rounded-lg border border-yellow-200 hover:border-yellow-300 transition"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className="bg-yellow-100 text-yellow-800 border-yellow-300 break-all max-w-full"
                        >
                          <Award className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="text-[12px] sm:text-xs">Certificate #{cert.certificateId}</span>
                        </Badge>
                        {cert.donationCount >= 5 && (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                            ⭐ {cert.donationCount} Donations
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[13px] sm:text-sm font-medium text-gray-900">
                          {cert.donationCount} {cert.donationCount === 1 ? "donation" : "donations"}
                        </p>
                        <p className="text-[11px] sm:text-xs text-gray-600">
                          Issued on {new Date(cert.issuedDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownloadCertificate(cert._id, cert.certificateId)} // Note: Logic slightly adjusted in impl
                      disabled={downloadingId === cert._id}
                      size="sm"
                      className="gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto justify-center min-w-[140px]"
                    >
                      {downloadingId === cert._id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span className="text-sm">Download</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Volunteer Certificates */}
          {volunteerCertificates.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Volunteer Certificates</h3>
              {volunteerCertificates.map((cert) => (
                <div
                  key={cert._id}
                  className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-300 transition"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className="bg-blue-100 text-blue-800 border-blue-300 break-all max-w-full"
                        >
                          <Award className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="text-[12px] sm:text-xs">Volunteering</span>
                        </Badge>
                        <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300">
                          {cert.ngoName}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[13px] sm:text-sm font-medium text-gray-900">
                          {cert.eventTitle}
                        </p>
                        <p className="text-[11px] sm:text-xs text-gray-600">
                          Issued on {new Date(cert.issuedDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownloadVolunteerCertificate(cert.certificateId, cert.eventTitle)}
                      disabled={downloadingId === cert.certificateId}
                      size="sm"
                      className="gap-2 bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto justify-center min-w-[140px]"
                    >
                      {downloadingId === cert.certificateId ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span className="text-sm">Download</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}