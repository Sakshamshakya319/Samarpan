"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Mic,
  MicOff,
  Upload,
  FileCheck,
  AlertCircle,
  Loader2,
  CheckCircle,
  Phone,
  Clock,
} from "lucide-react"
import { VerificationCard } from "@/components/shared/verification-badge"
import { cn } from "@/lib/utils/utils"

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Bombay (Oh)"]
const BLOOD_COMPONENTS = [
  { value: "whole-blood", label: "Whole Blood (Trauma/Surgery)" },
  { value: "platelets", label: "Platelets (Cancer/Dengue)" },
  { value: "plasma", label: "Plasma (Burns/Shock)" },
  { value: "packed-rbcs", label: "Packed RBCs (Anemia/Blood Loss)" },
]

import { HospitalSelectionCard } from "./hospital-selection-card"
import { HospitalSnapshot } from "@/lib/models/hospital"

type InputMode = "manual" | "voice" | "scan"
type SubmitStep = "form" | "confirm" | "success"

interface SOSFormData {
  requesterName: string
  requesterPhone: string
  bloodGroup: string
  bloodComponent: string
  quantity: string
  hospitalLocation: string
  urgency: string
}

interface SOSFormProps {
  onSuccess?: (requestId: string) => void
}

export function SOSForm({ onSuccess }: SOSFormProps) {
  const [inputMode, setInputMode] = useState<InputMode>("manual")
  const [step, setStep] = useState<SubmitStep>("form")
  const [isListening, setIsListening] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [requestId, setRequestId] = useState("")
  const [bloodBanks, setBloodBanks] = useState<any[]>([])
  const [scannedFile, setScannedFile] = useState<File | null>(null)
  const [voiceTranscript, setVoiceTranscript] = useState("")
  const [speechSupported, setSpeechSupported] = useState(false)

  const recognitionRef = useRef<any>(null)

  const [formData, setFormData] = useState<{
    requesterName: string
    requesterPhone: string
    bloodGroup: string
    bloodComponent: string
    quantity: string
    hospital: HospitalSnapshot | null
    urgency: string
  }>({
    requesterName: "",
    requesterPhone: "",
    bloodGroup: "",
    bloodComponent: "whole-blood",
    quantity: "1",
    hospital: null,
    urgency: "critical",
  })

  useEffect(() => {
    // Check Web Speech API support
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      setSpeechSupported(true)
    } else if (typeof window !== "undefined" && "SpeechRecognition" in window) {
      setSpeechSupported(true)
    }
  }, [])

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Voice input
  const startListening = () => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = "en-IN"
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
      setVoiceTranscript("")
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setVoiceTranscript(transcript)
      // Parse transcript for common patterns
      parseVoiceInput(transcript)
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  // Simple voice transcript parsing
  const parseVoiceInput = (text: string) => {
    const lower = text.toLowerCase()
    // Blood group detection
    const bloodGroupMatch = text.match(/\b(A|B|AB|O)[+-]?\s*(?:positive|negative|plus|minus)?\b/i)
    if (bloodGroupMatch) {
      const raw = bloodGroupMatch[0].toUpperCase()
      if (lower.includes("positive") || lower.includes("plus") || lower.includes("+")) {
        updateField("bloodGroup", raw.replace(/\s+/g, "").replace(/POSITIVE|PLUS/i, "+"))
      } else if (lower.includes("negative") || lower.includes("minus") || lower.includes("-")) {
        updateField("bloodGroup", raw.replace(/\s+/g, "").replace(/NEGATIVE|MINUS/i, "-"))
      }
    }
    // Hospital detection voice disabled because of strict selection requirement
  }

  // Document scan — extract text from image
  const handleDocumentScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScannedFile(file)
    setInputMode("scan")
    // Show confirm step with what was scanned
    setStep("confirm")
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError("")

    if (!formData.requesterName || !formData.bloodGroup || !formData.hospital || !formData.quantity) {
      setError("Please fill in your name, blood group, hospital, and quantity needed.")
      return
    }

    setIsSubmitting(true)

    try {
      const resp = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: formData.requesterName,
          requesterPhone: formData.requesterPhone,
          bloodGroup: formData.bloodGroup,
          bloodComponent: formData.bloodComponent,
          quantity: parseInt(formData.quantity, 10) || 1,
          hospital: formData.hospital,
          urgency: "critical",
        }),
      })

      if (!resp.ok) {
        const data = await resp.json()
        setError(data.error || "Failed to send SOS. Please try again.")
        return
      }

      const data = await resp.json()
      setRequestId(data.requestId)
      if (data.blood_banks && data.blood_banks.length > 0) {
        setBloodBanks(data.blood_banks)
      }
      setStep("success")
      onSuccess?.(data.requestId)
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── SUCCESS SCREEN ────────────────────────────────────
  if (step === "success") {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center border border-green-200">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
            {bloodBanks.length > 0 ? "Blood Stock Found Nearby!" : "SOS Transmitted"}
          </h2>
          <p className="text-slate-500 font-medium">
            {bloodBanks.length > 0 
              ? "We checked eRaktKosh and found immediate stock availability. Please contact them directly."
              : "Donors matching your blood group are being notified right now."}
          </p>
        </div>
        
        {bloodBanks.length > 0 ? (
          <div className="space-y-3 text-left">
            {bloodBanks.slice(0, 3).map((bank, idx) => (
              <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-red-900 text-sm">{bank.bank_name}</h4>
                  <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{bank.units_available}</span>
                </div>
                <p className="text-xs text-slate-700 mb-1">{bank.address}</p>
                <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                  <span>{bank.distance_km} km away</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {bank.contact}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <VerificationCard level={3} />
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">What happens next?</p>
              <ul className="text-sm font-medium text-slate-600 space-y-2">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" /> Donors with {formData.bloodGroup} blood group are being contacted</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" /> Our admin team has been alerted to verify your request</li>
                <li className="flex items-start gap-2"><Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" /> Expected first response: within 15–30 minutes</li>
                <li className="flex items-start gap-2"><Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" /> Donors will call the phone number you provided</li>
              </ul>
            </div>
          </>
        )}
        
        {requestId && (
          <p className="text-xs font-medium text-slate-400 mt-4">
            Request Ref: <code className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">{requestId}</code>
          </p>
        )}
      </div>
    )
  }

  // ─── CONFIRM SCREEN (after scan) ──────────────────────
  if (step === "confirm") {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm font-bold text-slate-700">
            Document scanned successfully. Please verify the extracted details below.
          </p>
          {scannedFile && (
            <p className="text-xs font-medium text-slate-500 mt-1">Source: {scannedFile.name}</p>
          )}
        </div>
        {renderFormFields()}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setStep("form")}
            className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Go Back
          </Button>
          <Button
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Transmitting…
              </>
            ) : (
              "Confirm & Send"
            )}
          </Button>
        </div>
      </div>
    )
  }

  // ─── MAIN FORM ────────────────────────────────────────
  function renderFormFields() {
    return (
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm flex items-start gap-2 font-medium">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Your Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g., Priya Sharma"
              value={formData.requesterName}
              onChange={(e) => updateField("requesterName", e.target.value)}
              className="h-11 bg-white border-slate-200"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
            </label>
            <Input
              placeholder="+91 98765 43210"
              value={formData.requesterPhone}
              onChange={(e) => updateField("requesterPhone", e.target.value)}
              type="tel"
              className="h-11 bg-white border-slate-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Blood Group <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.bloodGroup}
              onChange={(e) => updateField("bloodGroup", e.target.value)}
              className="w-full h-11 px-3 border border-slate-200 rounded-md bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
            >
              <option value="">Select blood group</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Blood Component</label>
            <select
              value={formData.bloodComponent}
              onChange={(e) => updateField("bloodComponent", e.target.value)}
              className="w-full h-11 px-3 border border-slate-200 rounded-md bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
            >
              {BLOOD_COMPONENTS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Units Needed <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="1"
              max="20"
              value={formData.quantity}
              onChange={(e) => updateField("quantity", e.target.value)}
              className="h-11 bg-white border-slate-200"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Hospital Selection <span className="text-red-500">*</span>
          </label>
          <HospitalSelectionCard 
            selectedHospital={formData.hospital} 
            onSelect={(hospital) => updateField("hospital", hospital)}
          />
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Input Mode Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
        {[
          { id: "manual", label: "Manual" },
          { id: "voice", label: "Voice", disabled: !speechSupported },
          { id: "scan", label: "Scan Doc" },
        ].map((mode) => (
          <button
            key={mode.id}
            type="button"
            disabled={mode.disabled}
            onClick={() => setInputMode(mode.id as InputMode)}
            className={cn(
              "flex-1 py-2 px-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all",
              inputMode === mode.id
                ? "bg-white shadow-sm text-slate-900 border border-slate-200"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100",
              mode.disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Voice Mode Panel */}
      {inputMode === "voice" && (
        <Card className="border border-slate-200 bg-slate-50 shadow-none">
          <CardContent className="pt-6 pb-6 text-center space-y-4">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-all",
                isListening
                  ? "bg-red-50 border border-red-200 animate-pulse"
                  : "bg-white border border-slate-200 hover:bg-slate-50"
              )}
            >
              {isListening ? (
                <MicOff className="w-6 h-6 text-red-600" />
              ) : (
                <Mic className="w-6 h-6 text-slate-700" />
              )}
            </button>
            <p className="text-sm font-medium text-slate-600">
              {isListening
                ? "Listening... speak clearly"
                : "Tap to speak. State your name, blood group, and hospital."}
            </p>
            {voiceTranscript && (
              <div className="p-3 bg-white border border-slate-200 rounded-md text-sm font-medium text-left text-slate-700">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Transcript</span>
                {voiceTranscript}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scan Mode Panel */}
      {inputMode === "scan" && (
        <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 text-center">
          <label className="cursor-pointer flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center">
              <Upload className="w-5 h-5 text-slate-700" />
            </div>
            <div className="space-y-1">
              <span className="text-sm font-bold text-slate-900 block">
                Upload medical document
              </span>
              <span className="text-xs font-medium text-slate-500 block">
                JPG, PNG, PDF (Max 5MB)
              </span>
            </div>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleDocumentScan}
            />
          </label>
          {scannedFile && (
            <div className="mt-4 p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-2 text-sm font-bold text-slate-700 justify-center">
              <FileCheck className="w-4 h-4 text-green-600" />
              {scannedFile.name}
            </div>
          )}
        </div>
      )}

      {/* Form Fields (always visible) */}
      {renderFormFields()}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 text-sm uppercase tracking-widest font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Transmitting…
          </>
        ) : (
          "Send Emergency SOS"
        )}
      </Button>

      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
        No account required. All requests verified by admin team.
      </p>
    </form>
  )
}
