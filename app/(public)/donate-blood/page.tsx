import { Metadata } from "next"
import { BloodRequestsList } from "@/components/features/blood-requests-list"

export const metadata: Metadata = {
  title: "Donate Blood - Samarpan",
  description: "View blood requests and donate to save lives",
}

export default function DonateBloodPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Donate Blood</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Your donation can save up to three lives. View current requests that match your blood type and step forward to make a difference.
          </p>
        </div>

        <BloodRequestsList />
      </div>
    </div>
  )
}