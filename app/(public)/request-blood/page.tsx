import { BloodRequestForm } from "@/components/features/blood-request-form"

export const metadata = {
  title: "Request Blood Donation | Samarpan",
  description: "Submit a blood donation request to find donors matching your blood group",
}

export default function RequestBloodPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 md:py-20 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Request Blood Donation</h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Need blood? Submit your request and we'll help you find suitable donors in your area as quickly as possible.
          </p>
        </div>
        <BloodRequestForm />
      </div>
    </main>
  )
}