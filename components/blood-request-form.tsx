"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAppSelector } from "@/lib/hooks"
import { useRouter } from "next/navigation"

const BLOOD_GROUPS = ["A-", "A+", "B-", "B+", "O-", "O+", "AB-", "AB+"]
const URGENCY_LEVELS = ["low", "normal", "high", "critical"]

export function BloodRequestForm() {
  const [bloodGroup, setBloodGroup] = useState("")
  const [quantity, setQuantity] = useState("")
  const [urgency, setUrgency] = useState("normal")
  const [reason, setReason] = useState("")
  const [hospitalLocation, setHospitalLocation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { token } = useAppSelector((state) => state.auth)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    if (!bloodGroup || !quantity || !hospitalLocation) {
      setError("Blood group, quantity, and hospital location are required")
      setIsLoading(false)
      return
    }

    if (!token) {
      setError("You must be logged in to request blood")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/blood-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bloodGroup,
          quantity: parseInt(quantity, 10),
          urgency,
          reason,
          hospitalLocation,
        }),
      })

      if (response.ok) {
        setSuccess("Blood request submitted successfully! Admin will review your request.")
        setBloodGroup("")
        setQuantity("")
        setUrgency("normal")
        setReason("")
        setHospitalLocation("")

        // Redirect after 2 seconds
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to submit blood request")
      }
    } catch (err) {
      setError("Error submitting blood request")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Request Blood Donation</CardTitle>
          <CardDescription>
            Submit your blood donation request. Our admin team will review and help match you with donors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>
            )}
            {success && (
              <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">{success}</div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Blood Group */}
              <div className="space-y-2">
                <label htmlFor="bloodGroup" className="text-sm font-medium">
                  Blood Group <span className="text-destructive">*</span>
                </label>
                <select
                  id="bloodGroup"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  required
                >
                  <option value="">Select blood group</option>
                  {BLOOD_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium">
                  Quantity (units) <span className="text-destructive">*</span>
                </label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="e.g., 2"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Hospital Location */}
            <div className="space-y-2">
              <label htmlFor="hospitalLocation" className="text-sm font-medium">
                Hospital Location <span className="text-destructive">*</span>
              </label>
              <Input
                id="hospitalLocation"
                placeholder="e.g., City Hospital, Emergency Ward, Room 501"
                value={hospitalLocation}
                onChange={(e) => setHospitalLocation(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Provide the address or location details of the hospital/medical facility
              </p>
            </div>

            {/* Urgency Level */}
            <div className="space-y-2">
              <label htmlFor="urgency" className="text-sm font-medium">
                Urgency Level
              </label>
              <select
                id="urgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                {URGENCY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Select how urgently you need the blood donation
              </p>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason for Request (Optional)
              </label>
              <Textarea
                id="reason"
                placeholder="e.g., Post-surgery recovery, medical condition, accident..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading} size="lg">
              {isLoading ? "Submitting..." : "Submit Blood Request"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Your request will be reviewed by our admin team and donors matching your blood group will be notified.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}