import { Metadata } from "next"
import { BloodRequestsList } from "@/components/blood-requests-list"

export const metadata: Metadata = {
  title: "Donate Blood - Samarpan",
  description: "View blood requests and donate to save lives",
}

export default function DonateBloodPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Donate Blood</h1>
          <p className="text-lg text-gray-600">
            Help save lives by donating blood. View requests that match your blood type.
          </p>
        </div>

        <BloodRequestsList />
      </div>
    </div>
  )
}