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
import { signupUser } from "@/lib/slices/authSlice"
import { GoogleLoginButton } from "@/components/google-login-button"

export default function SignupPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { isLoading, error, isAuthenticated, token } = useAppSelector((state) => state.auth)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [validationError, setValidationError] = useState("")

  // Redirect if user is already authenticated
  useEffect(() => {
    // Check if user is already logged in before signup
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

  // Redirect after successful signup
  useEffect(() => {
    if (isAuthenticated && !isLoading && token) {
      console.log("[v0] Signup successful, redirecting to dashboard")
      const timer = setTimeout(async () => {
        try {
          await router.push("/dashboard")
        } catch (err) {
          console.error("[v0] Redirect error:", err)
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, isLoading, token, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError("")

    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords do not match")
      return
    }

    console.log("[v0] Submitting signup form")
    dispatch(
      signupUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      }),
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join Samarpan and save lives</CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleLoginButton mode="signup" />
          <Separator className="my-6" />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <Input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            {validationError && <div className="text-red-600 text-sm">{validationError}</div>}
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
          <p className="text-center text-sm mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-red-600 hover:underline font-medium">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
