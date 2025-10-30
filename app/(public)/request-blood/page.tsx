import { BloodRequestForm } from "@/components/blood-request-form"

export const metadata = {
  title: "Request Blood Donation | Samarpan",
  description: "Submit a blood donation request to find donors matching your blood group",
}

export default function RequestBloodPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold">Request Blood Donation</h1>
          <p className="text-muted-foreground">
            Need blood? Submit your request and we'll help you find suitable donors in your area.
          </p>
        </div>
        <BloodRequestForm />
      </div>
    </main>
  )
}