"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, Download, QrCode } from "lucide-react"
import QRCode from "qrcode.react"

interface Registration {
  _id: string
  name: string
  email: string
  registrationNumber: string
  timeSlot: string
  qrToken: string
  donationStatus: string
  createdAt: string
}

interface Event {
  _id: string
  title: string
  location: string
  eventDate: string
  startTime: string
  endTime: string
}

export default function RegistrationConfirmationPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const eventId = params.eventId as string
  const registrationId = searchParams.get("registrationId")

  const [registration, setRegistration] = useState<Registration | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!registrationId) {
      setError("Registration ID not found")
      setIsLoading(false)
      return
    }

    const fetchRegistrationDetails = async () => {
      try {
        // Fetch registration details
        const regResponse = await fetch(
          `/api/event-registrations?registrationId=${registrationId}`
        )
        if (regResponse.ok) {
          const regData = await regResponse.json()
          setRegistration(regData.registration)

          // Fetch event details
          const eventResponse = await fetch(`/api/events?id=${eventId}`)
          if (eventResponse.ok) {
            const eventData = await eventResponse.json()
            const foundEvent = eventData.events?.find((e: Event) => e._id === eventId)
            if (foundEvent) {
              setEvent(foundEvent)
            }
          }
        } else {
          setError("Failed to load registration details")
        }
      } catch (err) {
        setError("Error loading confirmation details")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRegistrationDetails()
  }, [registrationId, eventId])

  const handleDownloadQR = () => {
    if (!registration) return

    const qrElement = document.getElementById("qr-code")
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading registration details...</span>
          </div>
        </div>
      </main>
    )
  }

  if (error || !registration) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            variant="outline"
            onClick={() => router.push("/events")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Registration not found"}</AlertDescription>
          </Alert>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 md:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push("/events")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>

        {/* Success Banner */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-green-900 mb-1">Registration Successful!</h2>
              <p className="text-sm text-green-800">
                Your registration has been confirmed. Please save your QR code for event check-in.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Confirmation Card */}
        <Card className="mb-6 border-2 border-emerald-200">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-emerald-900">
                  <QrCode className="w-5 h-5" />
                  Registration Confirmation
                </CardTitle>
                <CardDescription>Event Volunteer Registration</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                {registration.donationStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Details */}
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Registration Number</p>
                  <p className="text-lg font-bold text-emerald-700 font-mono bg-emerald-50 p-3 rounded-md">
                    {registration.registrationNumber}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Full Name</p>
                  <p className="text-lg font-semibold">{registration.name}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                  <p className="text-lg">{registration.email}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Time Slot</p>
                  <p className="text-lg font-semibold text-emerald-600">{registration.timeSlot}</p>
                </div>

                {event && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Event Date</p>
                      <p className="text-lg">{formatDate(event.eventDate)}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Event Location</p>
                      <p className="text-lg">{event.location}</p>
                    </div>
                  </>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Registration Date</p>
                  <p className="text-lg">
                    {new Date(registration.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Right Column - QR Code */}
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-600 mb-4">Your QR Code</p>
                <div id="qr-code" className="p-4 bg-white rounded-lg border border-gray-300 shadow-md">
                  <QRCode
                    value={registration.qrToken}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-4 text-center font-mono">
                  {registration.qrToken}
                </p>
                <Button
                  onClick={handleDownloadQR}
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download QR Code
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">Important Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-amber-900">
            <div className="flex gap-3">
              <span className="font-bold flex-shrink-0">1.</span>
              <span>Screenshot or download your QR code for the event.</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold flex-shrink-0">2.</span>
              <span>Present this QR code at the event during check-in.</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold flex-shrink-0">3.</span>
              <span>The admin will scan your QR code to verify your participation.</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold flex-shrink-0">4.</span>
              <span>Your donation record will be automatically added to your dashboard.</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => router.push("/dashboard")}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={() => router.push("/events")}
            variant="outline"
            className="flex-1"
          >
            Browse More Events
          </Button>
        </div>
      </div>
    </main>
  )
}