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
} from "lucide-react"
import { VerificationCard } from "@/components/shared/verification-badge"
import { cn } from "@/lib/utils/utils"

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Bombay (Oh)"]
const BLOOD_COMPONENTS = [
  { value: "whole-blood", label: "Whole Blood" },
  { value: "platelets", label: "Platelets" },
  { value: "plasma", label: "Plasma" },
  { value: "packed-rbcs", label: "Packed RBCs" },
]

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
  const [scannedFile, setScannedFile] = useState<File | null>(null)
  const [voiceTranscript, setVoiceTranscript] = useState("")
  const [speechSupported, setSpeechSupported] = useState(false)

  const recognitionRef = useRef<any>(null)

  const [formData, setFormData] = useState<SOSFormData>({
    requesterName: "",
    requesterPhone: "",
    bloodGroup: "",
    bloodComponent: "whole-blood",
    quantity: "1",
    hospitalLocation: "",
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

  const updateField = (field: keyof SOSFormData, value: string) => {
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
    // Hospital detection (very basic)
    const hospitalMatch = text.match(/(?:at|in|hospital|clinic)\s+([A-Za-z\s]+)(?:\.|,|$)/i)
    if (hospitalMatch) {
      updateField("hospitalLocation", hospitalMatch[1].trim())
    }
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

    if (!formData.requesterName || !formData.bloodGroup || !formData.hospitalLocation || !formData.quantity) {
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
          hospitalLocation: formData.hospitalLocation,
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
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-emerald-700 mb-2">SOS Sent!</h2>
          <p className="text-muted-foreground">
            Donors matching your blood group are being notified right now.
          </p>
        </div>
        <VerificationCard level={3} />
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-left">
          <p className="text-sm font-semibold text-blue-900 mb-1">What happens next?</p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>✅ Donors with {formData.bloodGroup} blood group are being contacted</li>
            <li>✅ Our admin team has been alerted to verify your request</li>
            <li>⏱️ Expected first response: within 15–30 minutes</li>
            <li>📞 Donors will call the phone number you provided</li>
          </ul>
        </div>
        {requestId && (
          <p className="text-xs text-muted-foreground">
            Request ID: <code className="font-mono bg-muted px-1 rounded">{requestId}</code>
          </p>
        )}
      </div>
    )
  }

  // ─── CONFIRM SCREEN (after scan) ──────────────────────
  if (step === "confirm") {
    return (
      <div className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-medium text-amber-900">
            📄 Document scanned. Please verify the details below before submitting.
          </p>
          {scannedFile && (
            <p className="text-xs text-amber-700 mt-1">File: {scannedFile.name}</p>
          )}
        </div>
        {renderFormFields()}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setStep("form")}
            className="flex-1"
          >
            ← Edit
          </Button>
          <Button
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending SOS…
              </>
            ) : (
              "✓ Confirm & Send SOS"
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
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">
              Your Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g., Priya Sharma"
              value={formData.requesterName}
              onChange={(e) => updateField("requesterName", e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Phone Number
            </label>
            <Input
              placeholder="+91 98765 43210"
              value={formData.requesterPhone}
              onChange={(e) => updateField("requesterPhone", e.target.value)}
              type="tel"
              className="h-11"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">
              Blood Group <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.bloodGroup}
              onChange={(e) => updateField("bloodGroup", e.target.value)}
              className="w-full h-11 px-3 border border-input rounded-md bg-background text-sm font-medium"
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
            <label className="text-sm font-semibold">Blood Component</label>
            <select
              value={formData.bloodComponent}
              onChange={(e) => updateField("bloodComponent", e.target.value)}
              className="w-full h-11 px-3 border border-input rounded-md bg-background text-sm"
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
            <label className="text-sm font-semibold">
              Units Needed <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="1"
              max="20"
              value={formData.quantity}
              onChange={(e) => updateField("quantity", e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold">
            Hospital Name & Location <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="e.g., AIIMS Delhi, Emergency Ward"
            value={formData.hospitalLocation}
            onChange={(e) => updateField("hospitalLocation", e.target.value)}
            className="h-11"
          />
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Input Mode Tabs */}
      <div className="flex gap-2 p-1 bg-muted rounded-xl">
        {[
          { id: "manual", label: "✍️ Manual" },
          { id: "voice", label: "🎤 Voice", disabled: !speechSupported },
          { id: "scan", label: "📄 Scan Doc" },
        ].map((mode) => (
          <button
            key={mode.id}
            type="button"
            disabled={mode.disabled}
            onClick={() => setInputMode(mode.id as InputMode)}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
              inputMode === mode.id
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
              mode.disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            {mode.label}
            {mode.disabled && " (N/A)"}
          </button>
        ))}
      </div>

      {/* Voice Mode Panel */}
      {inputMode === "voice" && (
        <Card className="border-2 border-dashed border-primary/30">
          <CardContent className="pt-4 text-center space-y-3">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all",
                isListening
                  ? "bg-red-100 border-2 border-red-400 animate-pulse"
                  : "bg-primary/10 border-2 border-primary/30 hover:bg-primary/20"
              )}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 text-red-600" />
              ) : (
                <Mic className="w-8 h-8 text-primary" />
              )}
            </button>
            <p className="text-sm text-muted-foreground">
              {isListening
                ? "Listening... speak clearly"
                : "Tap to speak. Say your name, blood group, and hospital."}
            </p>
            {voiceTranscript && (
              <div className="p-2 bg-muted rounded text-xs text-left">
                <span className="font-medium">Heard: </span>
                {voiceTranscript}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scan Mode Panel */}
      {inputMode === "scan" && (
        <div className="p-4 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5">
          <label className="cursor-pointer flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-primary" />
            <span className="text-sm font-medium">
              Upload hospital prescription or medical document
            </span>
            <span className="text-xs text-muted-foreground">
              JPG, PNG, PDF — max 5MB
            </span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleDocumentScan}
            />
          </label>
          {scannedFile && (
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
              <FileCheck className="w-4 h-4" />
              {scannedFile.name} — Please verify details below
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
        className="w-full h-14 text-lg font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-200"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending SOS…
          </>
        ) : (
          "🚨 Send Emergency SOS"
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        No account needed. Your request will be verified by our admin team.
      </p>
    </form>
  )
}
