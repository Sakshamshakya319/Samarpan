import { AdminImpactDashboard } from "@/components/admin/AdminImpactDashboard"

export default function ImpactMetricsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading text-slate-900">Research Impact Metrics</h1>
        <p className="text-slate-500 mt-2">
          Live statistics tracking the effectiveness of the FABSM algorithm and Samarpan platform.
        </p>
      </div>
      
      <AdminImpactDashboard />
    </div>
  )
}
