"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/lib/store/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertCircle,
  Heart,
  Plus,
  RefreshCw,
  Calendar,
  Phone,
  Zap,
  Loader2,
  CheckCircle,
} from "lucide-react"

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Bombay (Oh)"]
const BLOOD_COMPONENTS = [
  { value: "whole-blood", label: "Whole Blood" },
  { value: "platelets", label: "Platelets" },
  { value: "plasma", label: "Plasma" },
  { value: "packed-rbcs", label: "Packed RBCs" },
]

const CONDITIONS = [
  "Cancer (Chemotherapy)",
  "Thalassemia",
  "Sickle Cell Disease",
  "Aplastic Anemia",
  "Hemophilia",
  "Other",
]

interface CareProfile {
  _id: string
  patientName: string
  patientPhone: string
  bloodGroup: string
  bloodComponent: string
  condition: string
  hospital: string
  frequencyDays: number
  lastRequestDate?: string
  totalRequests: number
  createdAt: string
}

export default function CareCirclePage() {
  const router = useRouter()
  const { token, isAuthenticated } = useAppSelector((state) => state.auth)

  const [profiles, setProfiles] = useState<CareProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [reRaising, setReRaising] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    patientName: "",
    patientPhone: "",
    bloodGroup: "",
    bloodComponent: "whole-blood",
    condition: "",
    hospital: "",
    frequencyDays: "21",
    notes: "",
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/care-circle")
    } else {
      fetchProfiles()
    }
  }, [isAuthenticated])

  const fetchProfiles = async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const resp = await fetch("/api/care-circle", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (resp.ok) {
        const data = await resp.json()
        setProfiles(data.profiles || [])
      }
    } catch {
      setError("Failed to load Care Circle profiles")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const resp = await fetch("/api/care-circle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          frequencyDays: parseInt(formData.frequencyDays, 10) || 21,
        }),
      })

      if (resp.ok) {
        setSuccessMsg("Care Circle profile created!")
        setShowForm(false)
        setFormData({
          patientName: "",
          patientPhone: "",
          bloodGroup: "",
          bloodComponent: "whole-blood",
          condition: "",
          hospital: "",
          frequencyDays: "21",
          notes: "",
        })
        fetchProfiles()
        setTimeout(() => setSuccessMsg(""), 3000)
      } else {
        const data = await resp.json()
        setError(data.error || "Failed to create profile")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReRaise = async (profile: CareProfile) => {
    setReRaising(profile._id)
    try {
      // Create an SOS request with profile data
      const resp = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: profile.patientName,
          requesterPhone: profile.patientPhone,
          bloodGroup: profile.bloodGroup,
          bloodComponent: profile.bloodComponent,
          quantity: 1,
          hospitalLocation: profile.hospital,
          urgency: "high",
        }),
      })

      if (resp.ok) {
        setSuccessMsg(`Emergency re-raised for ${profile.patientName}! Donors are being notified.`)
        fetchProfiles()
        setTimeout(() => setSuccessMsg(""), 5000)
      } else {
        setError("Failed to re-raise emergency")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setReRaising(null)
    }
  }

  const getDaysUntilNext = (profile: CareProfile) => {
    if (!profile.lastRequestDate) return 0
    const last = new Date(profile.lastRequestDate)
    const nextDue = new Date(last.getTime() + profile.frequencyDays * 24 * 60 * 60 * 1000)
    const daysLeft = Math.ceil((nextDue.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    return daysLeft
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50/50 to-background">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-pink-600 fill-pink-600" />
              <span className="text-sm font-medium text-pink-600">Care Circle</span>
            </div>
            <h1 className="text-3xl font-bold">Recurring Patient Profiles</h1>
            <p className="text-muted-foreground mt-1 max-w-lg">
              For cancer, thalassemia, and sickle cell patients who need blood every few weeks.
              Save their profile and re-raise emergencies with one click.
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="gap-2 bg-pink-600 hover:bg-pink-700"
          >
            <Plus className="w-4 h-4" />
            Add Patient Profile
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <Card className="border-2 border-pink-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">New Patient Profile</CardTitle>
              <CardDescription>
                Save patient details for quick re-raise when they need blood again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProfile} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Patient Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Full name"
                      value={formData.patientName}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, patientName: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> Phone
                    </label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={formData.patientPhone}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, patientPhone: e.target.value }))
                      }
                      type="tel"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Blood Group <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, bloodGroup: e.target.value }))
                      }
                      className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                      required
                    >
                      <option value="">Select</option>
                      {BLOOD_GROUPS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Blood Component</label>
                    <select
                      value={formData.bloodComponent}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, bloodComponent: e.target.value }))
                      }
                      className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                    >
                      {BLOOD_COMPONENTS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Medical Condition</label>
                    <select
                      value={formData.condition}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, condition: e.target.value }))
                      }
                      className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                    >
                      <option value="">Select condition</option>
                      {CONDITIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Frequency (days)
                    </label>
                    <Input
                      type="number"
                      min="7"
                      max="90"
                      placeholder="21 (every 3 weeks)"
                      value={formData.frequencyDays}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, frequencyDays: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Hospital <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g., PGIMER Chandigarh, Ward 4"
                    value={formData.hospital}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, hospital: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-pink-600 hover:bg-pink-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
                      </>
                    ) : (
                      "Save Profile"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Profiles List */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No profiles yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Add recurring patients here so you can quickly re-raise emergencies without filling the form again.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="mt-4 gap-2 bg-pink-600 hover:bg-pink-700"
            >
              <Plus className="w-4 h-4" /> Add First Profile
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {profiles.map((profile) => {
              const daysLeft = getDaysUntilNext(profile)
              const isDue = daysLeft <= 3
              return (
                <div
                  key={profile._id}
                  className={`p-5 rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md ${isDue ? "border-orange-300 ring-1 ring-orange-200" : ""}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{profile.patientName}</h3>
                      {profile.condition && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          {profile.condition}
                        </span>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-primary">{profile.bloodGroup}</span>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    <p>🏥 {profile.hospital}</p>
                    {profile.patientPhone && (
                      <p>📞 {profile.patientPhone}</p>
                    )}
                    <p>🔄 Every {profile.frequencyDays} days</p>
                    {profile.totalRequests > 0 && (
                      <p>📊 {profile.totalRequests} past requests</p>
                    )}
                  </div>

                  {isDue && profile.lastRequestDate && (
                    <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800">
                      ⚠️ Due in {daysLeft <= 0 ? "overdue!" : `${daysLeft} days`}
                    </div>
                  )}

                  <Button
                    onClick={() => handleReRaise(profile)}
                    disabled={reRaising === profile._id}
                    className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    {reRaising === profile._id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" /> Re-raise Emergency
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
