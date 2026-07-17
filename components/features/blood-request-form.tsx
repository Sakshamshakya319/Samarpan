"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAppSelector } from "@/lib/store/hooks"
import { useRouter } from "next/navigation"
import { AlertCircle, Upload, FileCheck, Loader2 } from "lucide-react"
import { VerificationCard } from "@/components/shared/verification-badge"

const BLOOD_GROUPS = ["A-", "A+", "B-", "B+", "O-", "O+", "AB-", "AB+", "Bombay (Oh)"]
const URGENCY_LEVELS = ["low", "normal", "high", "critical"]
const BLOOD_COMPONENTS = [
  { value: "whole-blood", label: "Whole Blood" },
  { value: "platelets", label: "Platelets" },
  { value: "plasma", label: "Plasma" },
  { value: "packed-rbcs", label: "Packed RBCs" },
]

export function BloodRequestForm() {
  const [requestType, setRequestType] = useState("self")
  const [patientName, setPatientName] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [bloodGroup, setBloodGroup] = useState("")
  const [bloodComponent, setBloodComponent] = useState("whole-blood")
  const [quantity, setQuantity] = useState("")
  const [urgency, setUrgency] = useState("normal")
  const [reason, setReason] = useState("")
  const [hospitalLocation, setHospitalLocation] = useState("")
  const [hospitalDocumentImage, setHospitalDocumentImage] = useState<string | null>(null)
  const [hospitalDocumentFileName, setHospitalDocumentFileName] = useState("")
  const [verificationLevel, setVerificationLevel] = useState<1 | 2 | 3 | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { token } = useAppSelector((state) => state.auth)
  const router = useRouter()

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        setError("Please upload a valid image or PDF file")
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Document size must be less than 5MB")
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target?.result as string
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
          bloodComponent,
          quantity: parseInt(quantity, 10),
          urgency,
          reason,
          hospitalLocation,
          hospitalDocumentImage,
          hospitalDocumentFileName,
        }),
      })

      if (response.ok) {
        setSuccess("Blood request submitted successfully! Admin will review your request.")
        setVerificationLevel(hospitalDocumentImage ? 2 : 3)
        setRequestType("self")
        setPatientName("")
        setPatientPhone("")
        setBloodGroup("")
        setBloodComponent("whole-blood")
        setQuantity("")
        setUrgency("normal")
        setReason("")
        setHospitalLocation("")
        setHospitalDocumentImage(null)
        setHospitalDocumentFileName("")

        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to submit blood request")
      }
    } catch (err) {
      setError("Error submitting blood request")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
          <CardTitle className="text-xl font-bold text-slate-900">Request Details</CardTitle>
          <CardDescription className="text-slate-500">
            Submit your blood donation request. Our admin team will review and help match you with donors.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-3 border border-red-100">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="font-medium">{error}</div>
              </div>
            )}
            {success && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 text-green-800 rounded-lg text-sm flex items-start gap-3 border border-green-100">
                  <FileCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="font-medium">{success}</div>
                </div>
                {verificationLevel && <VerificationCard level={verificationLevel} />}
              </div>
            )}

            {/* Request Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">
                Blood Request For <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="requestType"
                    value="self"
                    checked={requestType === "self"}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="w-4 h-4 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-sm font-medium text-slate-900">For Myself</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="requestType"
                    value="others"
                    checked={requestType === "others"}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="w-4 h-4 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-sm font-medium text-slate-900">For Someone Else</span>
                </label>
              </div>
            </div>

            {/* Patient Details (if requesting for others) */}
            {requestType === "others" && (
              <div className="grid md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-lg border border-slate-200">
                <div className="space-y-2">
                  <label htmlFor="patientName" className="text-sm font-semibold text-slate-700">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="patientName"
                    placeholder="Enter patient's full name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required={requestType === "others"}
                    className="h-11 bg-white border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="patientPhone" className="text-sm font-semibold text-slate-700">
                    Patient Phone <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="patientPhone"
                    placeholder="Enter phone number"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    required={requestType === "others"}
                    className="h-11 bg-white border-slate-300"
                  />
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Blood Group */}
              <div className="space-y-2">
                <label htmlFor="bloodGroup" className="text-sm font-semibold text-slate-700">
                  Blood Group <span className="text-red-500">*</span>
                </label>
                <select
                  id="bloodGroup"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full h-11 px-3 py-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-sm"
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

              {/* Blood Component */}
              <div className="space-y-2">
                <label htmlFor="bloodComponent" className="text-sm font-semibold text-slate-700">
                  Blood Component
                </label>
                <select
                  id="bloodComponent"
                  value={bloodComponent}
                  onChange={(e) => setBloodComponent(e.target.value)}
                  className="w-full h-11 px-3 py-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-sm"
                >
                  {BLOOD_COMPONENTS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  Select the type of blood product needed
                </p>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-semibold text-slate-700">
                  Quantity (units) <span className="text-red-500">*</span>
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
                  className="h-11 bg-white border-slate-200"
                />
              </div>

              {/* Urgency Level */}
              <div className="space-y-2">
                <label htmlFor="urgency" className="text-sm font-semibold text-slate-700">
                  Urgency Level
                </label>
                <select
                  id="urgency"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full h-11 px-3 py-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-sm"
                >
                  {URGENCY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  Select how urgently you need the blood
                </p>
              </div>
            </div>

            {/* Hospital Location */}
            <div className="space-y-2">
              <label htmlFor="hospitalLocation" className="text-sm font-semibold text-slate-700">
                Hospital Location <span className="text-red-500">*</span>
              </label>
              <Input
                id="hospitalLocation"
                placeholder="e.g., City Hospital, Emergency Ward, Room 501"
                value={hospitalLocation}
                onChange={(e) => setHospitalLocation(e.target.value)}
                required
                className="h-11 bg-white border-slate-200"
              />
              <p className="text-xs text-slate-500">
                Provide the full address details of the hospital/facility
              </p>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-semibold text-slate-700">
                Reason for Request <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Textarea
                id="reason"
                placeholder="e.g., Post-surgery recovery, medical condition, accident..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="bg-white border-slate-200 resize-none"
              />
            </div>

            {/* Hospital Document Upload */}
            <div className="space-y-4 p-6 border border-slate-200 rounded-xl bg-slate-50">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-5 h-5 text-slate-700" />
                <label htmlFor="hospitalDocument" className="text-sm font-bold text-slate-900">
                  Upload Medical Document <span className="text-red-500">*</span>
                </label>
              </div>
              
              <Input
                id="hospitalDocument"
                type="file"
                accept="image/*,.pdf"
                onChange={handleDocumentUpload}
                className="cursor-pointer bg-white file:bg-slate-100 file:text-slate-700 file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md hover:file:bg-slate-200 transition-all border-slate-300"
                required
              />
              <p className="text-xs text-slate-500">
                Upload prescription or medical report. Max 5MB. Formats: JPG, PNG, PDF
              </p>
              
              {hospitalDocumentImage && (
                <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-4 h-4 text-green-700" />
                  </div>
                  <div className="text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                    <p className="font-semibold text-slate-900">Document ready</p>
                    <p className="text-xs text-slate-500">{hospitalDocumentFileName}</p>
                  </div>
                </div>
              )}

              <div className="p-4 border border-slate-200 rounded-lg bg-white mt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-700">
                    <p className="font-semibold text-slate-900 mb-1">Verification Required</p>
                    <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-600">
                      <li>Document helps donors trust your blood request</li>
                      <li>Include hospital name and patient details if visible</li>
                      <li>Admin will verify the document before matching with donors</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100">
              <Button 
                type="submit" 
                className="w-full h-14 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  "Submit Blood Request"
                )}
              </Button>
              <p className="text-xs text-slate-500 text-center mt-4">
                Your request will be reviewed by our team and matching donors will be notified.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}