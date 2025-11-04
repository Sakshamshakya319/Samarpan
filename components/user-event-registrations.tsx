"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Calendar, MapPin, Clock, CheckCircle2, AlertCircle, QrCode, Download, Eye } from "lucide-react"
import { useAppSelector } from "@/lib/hooks"
import Link from "next/link"
import QRCode from "qrcode.react"
import { EventRegistrationDetails } from "@/components/event-registration-details"

interface EventRegistration {
  _id: string
  eventId: string
  name: string
  email: string
  registrationNumber: string
  timeSlot: string
  status: string
  qrToken?: string
  qrVerified: boolean
  donationStatus: string
  createdAt: string
  event?: {
    title: string
    location: string
    eventDate: string
  }
}

export function UserEventRegistrations() {
  const { token } = useAppSelector((state) => state.auth)
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchRegistrations()
  }, [token])

  const fetchRegistrations = async () => {
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/admin/event-registrations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRegistrations(data.registrations || [])
      } else {
        setError("Failed to load event registrations")
      }
    } catch (err) {
      console.error("Error fetching registrations:", err)
      setError("Error loading registrations")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadQR = (registration: EventRegistration) => {
    const qrElement = document.getElementById(`qr-${registration._id}`)
    if (qrElement) {
      const canvas = qrElement.querySelector("canvas")
      if (canvas) {
        const link = document.createElement("a")
        link.href = canvas.toDataURL("image/png")
        link.download = `registration-${registration.registrationNumber}-qr.png`
        link.click()
      }
    }
  }

  const handleRefreshQR = async () => {
    // Refetch registrations to get updated QR codes
    setIsLoading(true)
    await fetchRegistrations()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-300"
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-300"
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Event Registrations
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span>Loading registrations...</span>
        </CardContent>
      </Card>
    )
  }

  if (registrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Event Registrations
          </CardTitle>
          <CardDescription>No event registrations yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-4">You haven't registered for any events yet.</p>
            <Link href="/events">
              <Button>Browse Events</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Event Registrations
        </CardTitle>
        <CardDescription>Your registered events and donation records</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {registrations.map((registration) => (
            <div
              key={registration._id}
              className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {registration.event?.title || "Event"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Reg #: {registration.registrationNumber}
                  </p>
                  {registration.email && (
                    <p className="text-sm text-gray-600">
                      Email: {registration.email}
                    </p>
                  )}
                  {registration.name && (
                    <p className="text-sm text-gray-600">
                      Name: {registration.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`${getStatusColor(registration.donationStatus)}`}
                    variant="outline"
                  >
                    {registration.donationStatus}
                  </Badge>
                  <EventRegistrationDetails registration={registration} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {registration.event && (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{formatDate(registration.event.eventDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="truncate">{registration.event.location}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{registration.timeSlot}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {registration.qrVerified ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-green-700">Verified</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-amber-700">Pending Verification</span>
                    </>
                  )}
                </div>
              </div>

              {/* QR Code Section */}
              {!registration.qrVerified && registration.qrToken && (
                <div className="flex flex-col sm:flex-row gap-3 items-center bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                  <div
                    id={`qr-${registration._id}`}
                    className="flex-shrink-0"
                  >
                    <QRCode
                      value={registration.qrToken || ""}
                      size={80}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 mb-1">QR Token:</p>
                    <code className="text-xs bg-white p-2 rounded block overflow-auto border border-blue-300 font-mono">
                      {registration.qrToken}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadQR(registration)}
                    className="flex-shrink-0"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              )}

              {/* Fallback when QR Token is not available */}
              {!registration.qrVerified && !registration.qrToken && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-800">QR code is being generated. Click refresh to try again.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRefreshQR}
                    className="flex-shrink-0"
                  >
                    Refresh
                  </Button>
                </div>
              )}

              {registration.qrVerified && (
                <Alert className="bg-green-50 border-green-200 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Your donation has been verified and recorded.
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-gray-500">
                Registered on {formatDate(registration.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}