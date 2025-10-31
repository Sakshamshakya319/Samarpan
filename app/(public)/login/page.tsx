"use client"

// Mark as dynamic to handle authentication state and redirects
export const dynamic = "force-dynamic"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { loginUser } from "@/lib/slices/authSlice"
import { GoogleLoginButton } from "@/components/google-login-button"
import { ForgotPasswordDialog } from "@/components/forgot-password-dialog"

export default function LoginPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { isLoading, error, isAuthenticated, token } = useAppSelector((state) => state.auth)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)

  // Redirect if user is already authenticated
  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (token && !isLoading) {
      console.log("[v0] User already authenticated, redirecting to dashboard")
      const timer = setTimeout(async () => {
        try {
          await router.push("/dashboard")
        } catch (err) {
          console.error("[v0] Redirect error:", err)
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [token, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Submitting login form")
    dispatch(loginUser({ email, password }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">User Login</CardTitle>
          <CardDescription>Sign in to your Samarpan account</CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleLoginButton mode="signin" />
          <Separator className="my-6" />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Password</label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-sm text-red-600 hover:text-red-700 hover:underline font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
          <p className="text-center text-sm mt-4">
            Don't have an account?{" "}
            <Link href="/signup" className="text-red-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>

      <ForgotPasswordDialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen} />
    </div>
  )
}
