"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Mail,
  User,
  Hash,
  Eye,
  X,
} from "lucide-react"
import { QRCodeGenerator } from "@/components/qr-code-generator"

interface EventDetails {
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
    description?: string
    bloodType?: string
  }
}

interface EventRegistrationDetailsProps {
  registration: EventDetails
}

export function EventRegistrationDetails({ registration }: EventRegistrationDetailsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-1"
      >
        <QrCode className="w-4 h-4" />
        View QR Code
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Registration Details
            </DialogTitle>
            <DialogDescription>Complete information and QR code for your event registration</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Event Information */}
            {registration.event && (
              <>
                <div>
                  <h3 className="font-semibold mb-3 text-lg">{registration.event.title}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{registration.event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{new Date(registration.event.eventDate).toLocaleDateString()}</span>
                    </div>
                    {registration.event.description && (
                      <p className="text-sm text-gray-600 mt-2">{registration.event.description}</p>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Donor Information */}
            <div>
              <h3 className="font-semibold mb-3">Your Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Full Name</p>
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {registration.name}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Email</p>
                  <p className="font-semibold text-sm flex items-center gap-2 break-all">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span>{registration.email || "Not available"}</span>
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Registration Number</p>
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    {registration.registrationNumber}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Time Slot</p>
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {registration.timeSlot}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Status Information */}
            <div>
              <h3 className="font-semibold mb-3">Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-2">Donation Status</p>
                  <Badge className={getStatusColor(registration.donationStatus)}>
                    {registration.donationStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-2">Verification Status</p>
                  <div className="flex items-center gap-2">
                    {registration.tokenVerified ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">Pending</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* QR Code Section - Replace Token Display */}
            {registration.alphanumericToken && registration.event && (
              <>
                <div>
                  <h3 className="font-semibold mb-3">Your Event QR Code</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <QRCodeGenerator
                      registrationId={registration._id}
                      alphanumericToken={registration.alphanumericToken}
                      userName={registration.name}
                      eventTitle={registration.event.title}
                      eventDate={registration.event.eventDate}
                      timeSlot={registration.timeSlot}
                    />
                  </div>

                  <Alert className="bg-blue-50 border-blue-200 mt-4">
                    <QrCode className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Show this QR code to the admin at the event for attendance verification.
                    </AlertDescription>
                  </Alert>
                </div>

                <Separator />
              </>
            )}

            {/* QR Code Not Available Fallback */}
            {!registration.alphanumericToken && (
              <>
                <div>
                  <h3 className="font-semibold mb-3">Your Event QR Code</h3>
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">QR Code Not Available</p>
                        <p className="text-sm text-amber-800 mt-1">Your QR code is being generated. Please refresh the page to try again.</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      className="flex-shrink-0 whitespace-nowrap"
                    >
                      Refresh
                    </Button>
                  </div>
                </div>

                <Separator />
              </>
            )}

            {registration.tokenVerified && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your attendance has been successfully verified and recorded. Thank you for your participation!
                </AlertDescription>
              </Alert>
            )}

            {/* Registration Date */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p>Registered on {formatDate(registration.createdAt)}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}