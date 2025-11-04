"use client"

export const dynamic = "force-dynamic"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"

export default function AdminStaffLogin() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken")
    const adminRole = localStorage.getItem("adminRole")

    if (adminToken && adminRole) {
      console.log("[Admin Staff] Already authenticated, redirecting to dashboard")
      const timer = setTimeout(() => {
        if (adminRole === "superadmin") {
          router.push("/admin/super-admin")
        } else {
          router.push("/admin/dashboard")
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Login failed")
        return
      }

      // Check if user is superadmin
      if (data.admin.role === "superadmin") {
        setError("Super admins should use the admin login page")
        return
      }

      // Store token and admin info in localStorage
      localStorage.setItem("adminToken", data.token)
      localStorage.setItem("adminEmail", data.admin.email)
      localStorage.setItem("adminRole", data.admin.role)
      localStorage.setItem("adminPermissions", JSON.stringify(data.admin.permissions || []))
      localStorage.setItem("adminName", data.admin.name)

      // Redirect to admin dashboard
      router.push("/admin/dashboard")
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-xl">S</span>
          </div>
          <h1 className="text-3xl font-bold">Admin Login</h1>
          <p className="text-muted-foreground mt-2">Samarpan Administration Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle size={20} className="text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border space-y-3">
          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              Super Admin?{" "}
              <Link href="/admin/login" className="text-primary hover:underline font-medium">
                Use Admin Login
              </Link>
            </p>
          </div>
          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              Not an admin?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                User Login
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}