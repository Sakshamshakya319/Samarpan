"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Users, Heart } from "lucide-react"

interface EventRegistrationStatusProps {
  isAlreadyRegistered: boolean
  registrationStatus: {
    isDonorRegistered: boolean
    isVolunteerRegistered: boolean
  }
  showDetails?: boolean
}

export function EventRegistrationStatus({ 
  isAlreadyRegistered, 
  registrationStatus, 
  showDetails = true 
}: EventRegistrationStatusProps) {
  if (!isAlreadyRegistered) return null

  return (
    <Alert className="bg-green-50 border-green-200">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        <div className="space-y-2">
          <p className="font-medium">You are already registered for this event!</p>
          
          {showDetails && (
            <div className="space-y-1">
              {registrationStatus.isDonorRegistered && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-3 h-3 text-green-600" />
                  <span>Registered as Donor</span>
                </div>
              )}
              {registrationStatus.isVolunteerRegistered && (
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="w-3 h-3 text-green-600" />
                  <span>Registered as Volunteer</span>
                </div>
              )}
            </div>
          )}
          
          <p className="text-sm">
            {registrationStatus.isDonorRegistered && registrationStatus.isVolunteerRegistered
              ? "Thank you for registering as both a donor and volunteer!"
              : registrationStatus.isVolunteerRegistered
              ? "Thank you for your commitment to volunteering!"
              : "Thank you for your participation as a donor!"
            }
          </p>
        </div>
      </AlertDescription>
    </Alert>
  )
}