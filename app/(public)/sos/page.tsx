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
    <main className="min-h-screen bg-slate-50">
      {/* Emergency Header Banner */}
      <div className="bg-red-600 text-white text-center py-3 px-4 shadow-sm relative z-10">
        <div className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          <span>Emergency SOS — Instant Donor Network</span>
          <AlertTriangle className="w-4 h-4 animate-pulse" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
        {/* Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            Live Emergency System
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            Blood SOS
          </h1>
          <p className="text-base text-slate-500 max-w-lg mx-auto font-medium">
            Need blood urgently? Fill this form in under 60 seconds — no account needed.
            Donors near you will be contacted immediately.
          </p>
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Clock, label: "< 60 sec", sub: "to submit" },
            { icon: Shield, label: "Verified", sub: "by admin team" },
            { icon: Phone, label: "Direct call", sub: "from donors" },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-center"
            >
              <Icon className="w-5 h-5 text-slate-400 mb-2" />
              <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">{label}</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">{sub}</span>
            </div>
          ))}
        </div>

        {/* SOS Form Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
          <SOSForm />
        </div>

        {/* Verification Level Info */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Trust Verification Levels</h3>
          <div className="space-y-3">
            {[
              {
                color: "bg-green-50 text-green-700 border-green-200",
                label: "Level 1 — Fully Verified",
                desc: "Hospital document verified",
              },
              {
                color: "bg-amber-50 text-amber-700 border-amber-200",
                label: "Level 2 — Hospital Verified",
                desc: "Hospital verified, doc pending",
              },
              {
                color: "bg-red-50 text-red-700 border-red-200",
                label: "Level 3 — Pending",
                desc: "SOS submission — pending admin",
              },
            ].map(({ color, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full border ${color.split(' ')[0]} ${color.split(' ')[2]}`} />
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <span className="font-semibold text-sm text-slate-700">{label}</span>
                  <span className="text-xs font-medium text-slate-500">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Helpline */}
        <div className="text-center text-xs font-medium text-slate-500 space-y-1.5 pb-8">
          <p>
            Need help?{" "}
            <a
              href="mailto:support@samarpan.com"
              className="text-slate-900 hover:text-red-600 underline transition-colors"
            >
              support@samarpan.com
            </a>
          </p>
          <p>
            Or{" "}
            <a href="/request-blood" className="text-slate-900 hover:text-red-600 underline transition-colors">
              log in to submit a verified request
            </a>{" "}
            for faster donor matching.
          </p>
        </div>
      </div>
    </main>
  )
}
