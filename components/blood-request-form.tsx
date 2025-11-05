"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAppSelector } from "@/lib/hooks"
import { useRouter } from "next/navigation"
import { AlertCircle, Upload, FileCheck } from "lucide-react"

const BLOOD_GROUPS = ["A-", "A+", "B-", "B+", "O-", "O+", "AB-", "AB+"]
const URGENCY_LEVELS = ["low", "normal", "high", "critical"]

export function BloodRequestForm() {
  const [requestType, setRequestType] = useState("self")
  const [patientName, setPatientName] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [bloodGroup, setBloodGroup] = useState("")
  const [quantity, setQuantity] = useState("")
  const [urgency, setUrgency] = useState("normal")
  const [reason, setReason] = useState("")
  const [hospitalLocation, setHospitalLocation] = useState("")
  const [hospitalDocumentImage, setHospitalDocumentImage] = useState<string | null>(null)
  const [hospitalDocumentFileName, setHospitalDocumentFileName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { token } = useAppSelector((state) => state.auth)
  const router = useRouter()

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        setError("Please upload a valid image or PDF file")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Document size must be less than 5MB")
        return
      }

      // Convert to base64
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target?.result as string
        // Extract only the base64 part
        const base64Data = base64String.includes(',') 
          ? base64String.split(',')[1] 
          : base64String
        setHospitalDocumentImage(base64Data)
        setHospitalDocumentFileName(file.name)
        setError("")
      }
      reader.readAsDataURL(file)
    }
  }

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

    if (!hospitalDocumentImage) {
      setError("Hospital document/proof image is required for all blood requests")
      setIsLoading(false)
      return
    }

    if (requestType === "others") {
      if (!patientName.trim() || !patientPhone.trim()) {
        setError("Patient name and phone number are required when requesting for others")
        setIsLoading(false)
        return
      }
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
          requestType,
          patientName: requestType === "others" ? patientName : undefined,
          patientPhone: requestType === "others" ? patientPhone : undefined,
          bloodGroup,
          quantity: parseInt(quantity, 10),
          urgency,
          reason,
          hospitalLocation,
          hospitalDocumentImage,
          hospitalDocumentFileName,
        }),
      })

      if (response.ok) {
        setSuccess("Blood request submitted successfully! Admin will review your request and document.")
        setRequestType("self")
        setPatientName("")
        setPatientPhone("")
        setBloodGroup("")
        setQuantity("")
        setUrgency("normal")
        setReason("")
        setHospitalLocation("")
        setHospitalDocumentImage(null)
        setHospitalDocumentFileName("")

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
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm flex items-start gap-2">
                <FileCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>{success}</div>
              </div>
            )}

            {/* Request Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Blood Request For <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="requestType"
                    value="self"
                    checked={requestType === "self"}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">For Myself</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="requestType"
                    value="others"
                    checked={requestType === "others"}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">For Someone Else</span>
                </label>
              </div>
            </div>

            {/* Patient Details (if requesting for others) */}
            {requestType === "others" && (
              <div className="grid md:grid-cols-2 gap-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                <div className="space-y-2">
                  <label htmlFor="patientName" className="text-sm font-medium">
                    Patient Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="patientName"
                    placeholder="Enter patient's full name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required={requestType === "others"}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="patientPhone" className="text-sm font-medium">
                    Patient Phone Number <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="patientPhone"
                    placeholder="Enter patient's phone number"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    required={requestType === "others"}
                  />
                </div>
              </div>
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

            {/* Hospital Document Upload */}
            <div className="space-y-3 p-4 border-2 border-dashed border-primary/30 rounded-md bg-primary/5">
              <label htmlFor="hospitalDocument" className="text-sm font-medium flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Hospital Document/Proof <span className="text-destructive">*</span>
              </label>
              <Input
                id="hospitalDocument"
                type="file"
                accept="image/*,.pdf"
                onChange={handleDocumentUpload}
                className="cursor-pointer"
                required
              />
              <p className="text-xs text-muted-foreground">
                Upload prescription, medical report, or hospital document as proof of blood requirement. Max 5MB. Accepted formats: JPG, PNG, GIF, WebP, PDF
              </p>
              
              {hospitalDocumentImage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900">Document uploaded</p>
                    <p className="text-xs text-green-700">{hospitalDocumentFileName}</p>
                  </div>
                </div>
              )}

              <div className="p-3 border border-orange-200 rounded-md bg-orange-50">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-orange-900">
                    <p className="font-medium mb-1">📄 Important: Document Required</p>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      <li>This document helps donors trust your blood request</li>
                      <li>Upload a clear photo or scan of your prescription/medical report</li>
                      <li>Include hospital name and relevant medical details if visible</li>
                      <li>Admin will verify the document before matching with donors</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading} size="lg">
              {isLoading ? "Submitting..." : "Submit Blood Request"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Your request and document will be reviewed by our admin team and donors matching your blood group will be notified.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}