"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminFundingDonations } from "@/components/admin-funding-donations"

export default function AdminFundingPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken")
    const adminEmail = localStorage.getItem("adminEmail")
    if (!adminToken || !adminEmail) {
      router.push("/admin/staff/login")
      return
    }
    setToken(adminToken)
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!token) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6">
          <AdminFundingDonations token={token} />
        </div>
      </div>
    </main>
  )
}