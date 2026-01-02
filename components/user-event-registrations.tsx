"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Calendar, MapPin, Clock, CheckCircle2, AlertCircle, QrCode, Eye } from "lucide-react"
import { useAppSelector } from "@/lib/hooks"
import Link from "next/link"
import { EventRegistrationDetails } from "@/components/event-registration-details"

interface EventRegistration {
  _id: string
  eventId: string
  name: string
  email: string
  registrationNumber: string
  timeSlot: string
  status: string
  alphanumericToken?: string
  tokenVerified: boolean
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
      const response = await fetch("/api/users/event-registrations", {
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

  const handleRefreshRegistrations = async () => {
    // Refetch registrations to get updated data
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
            <QrCode className="w-5 h-5" />
            Your Event QR Codes
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
            <QrCode className="w-5 h-5" />
            Your Event QR Codes
          </CardTitle>
          <CardDescription>No event registrations yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <QrCode className="w-12 h-12 mx-auto text-gray-300 mb-4" />
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
          <QrCode className="w-5 h-5" />
          Your Event QR Codes
        </CardTitle>
        <CardDescription>Your registered events with QR codes for attendance verification</CardDescription>
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
              className="border rounded-lg p-3 sm:p-4 hover:border-primary/50 transition-colors"
            >
              {/* Header Section - Responsive */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg truncate">
                    {registration.event?.title || "Event"}
                  </h3>
                  <div className="space-y-1 mt-1">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      Reg #: {registration.registrationNumber}
                    </p>
                    {registration.email && (
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        Email: {registration.email}
                      </p>
                    )}
                    {registration.name && (
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        Name: {registration.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    className={`${getStatusColor(registration.donationStatus)} text-xs sm:text-sm`}
                    variant="outline"
                  >
                    {registration.donationStatus}
                  </Badge>
                  <EventRegistrationDetails registration={registration} />
                </div>
              </div>

              {/* Event Details Grid - Mobile Optimized */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
                {registration.event && (
                  <>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                      <span className="truncate">{formatDate(registration.event.eventDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                      <span className="truncate">{registration.event.location}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{registration.timeSlot}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  {registration.tokenVerified ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                      <span className="text-green-700">Verified</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0" />
                      <span className="text-amber-700">Pending</span>
                    </>
                  )}
                </div>
              </div>

              {/* QR Code Available Info */}
              {registration.alphanumericToken && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <p className="text-xs sm:text-sm text-blue-800 font-medium">
                      QR Code Ready - Click "View Details" to see your QR code
                    </p>
                  </div>
                </div>
              )}

              {/* Fallback when QR Code is not available */}
              {!registration.alphanumericToken && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-3 mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3 h-3 sm:h-4 sm:w-4 text-amber-600 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-amber-800">QR code is being generated. Click refresh to try again.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRefreshRegistrations}
                    className="flex-shrink-0 text-xs sm:text-sm"
                  >
                    Refresh
                  </Button>
                </div>
              )}

              {registration.tokenVerified && (
                <Alert className="bg-green-50 border-green-200 mb-3">
                  <CheckCircle2 className="h-3 h-3 sm:h-4 sm:w-4 text-green-600" />
                  <AlertDescription className="text-xs sm:text-sm text-green-800">
                    Your attendance has been verified and recorded.
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