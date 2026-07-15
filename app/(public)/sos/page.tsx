import type { Metadata } from "next"
import { SOSForm } from "@/components/features/sos-form"
import { AlertTriangle, Clock, Shield, Phone } from "lucide-react"

export const metadata: Metadata = {
  title: "Emergency SOS — Request Blood Now | Samarpan",
  description:
    "Emergency blood request — no login required. Submit an SOS in under 60 seconds. Voice, document scan, or manual input.",
}

export default function SOSPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-red-50 via-background to-background">
      {/* Emergency Header Banner */}
      <div className="bg-red-600 text-white text-center py-3 px-4">
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          <span>Emergency SOS — No login required. Your request reaches donors instantly.</span>
          <AlertTriangle className="w-4 h-4 animate-pulse" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            Live Emergency System
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-red-700 leading-tight">
            🚨 Blood SOS
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Need blood urgently? Fill this form in under 60 seconds — no account needed.
            Donors near you will be contacted immediately.
          </p>
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Clock, label: "< 60 sec", sub: "to submit" },
            { icon: Shield, label: "Verified", sub: "by admin team" },
            { icon: Phone, label: "Direct call", sub: "from donors" },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex flex-col items-center p-3 bg-white border border-red-100 rounded-xl shadow-sm text-center"
            >
              <Icon className="w-5 h-5 text-red-600 mb-1" />
              <span className="text-sm font-bold text-foreground">{label}</span>
              <span className="text-xs text-muted-foreground">{sub}</span>
            </div>
          ))}
        </div>

        {/* SOS Form Card */}
        <div className="bg-white border-2 border-red-200 rounded-2xl shadow-xl shadow-red-100 p-6">
          <SOSForm />
        </div>

        {/* Verification Level Info */}
        <div className="p-4 bg-muted/50 rounded-xl border border-border">
          <h3 className="text-sm font-semibold mb-3">Trust Verification Levels</h3>
          <div className="space-y-2">
            {[
              {
                emoji: "🟢",
                label: "Level 1 — Fully Verified",
                desc: "Hospital document uploaded and verified by admin",
              },
              {
                emoji: "🟡",
                label: "Level 2 — Hospital Verified",
                desc: "Hospital verified, document pending review",
              },
              {
                emoji: "🔴",
                label: "Level 3 — Pending",
                desc: "SOS submission — admin will verify shortly",
              },
            ].map(({ emoji, label, desc }) => (
              <div key={label} className="flex items-start gap-2 text-sm">
                <span className="text-base">{emoji}</span>
                <div>
                  <span className="font-medium">{label}</span>
                  <span className="text-muted-foreground"> — {desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Helpline */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Need help?{" "}
            <a
              href="mailto:support@samarpan.com"
              className="text-red-600 underline font-medium"
            >
              support@samarpan.com
            </a>
          </p>
          <p className="mt-1">
            Or{" "}
            <a href="/request-blood" className="text-primary underline">
              log in to submit a verified request
            </a>{" "}
            for faster donor matching.
          </p>
        </div>
      </div>
    </main>
  )
}
