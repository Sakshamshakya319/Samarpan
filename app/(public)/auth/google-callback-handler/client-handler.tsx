"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppDispatch } from "@/lib/hooks"
import { loginSuccess } from "@/lib/slices/authSlice"
import { setUser } from "@/lib/slices/userSlice"

export default function GoogleCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get("token")
        const userJson = searchParams.get("user")

        if (!token || !userJson) {
          console.error("[Google Callback Handler] Missing token or user data")
          router.push("/login?error=Missing authentication data")
          return
        }

        // Parse user data
        const user = JSON.parse(decodeURIComponent(userJson))

        console.log("[Google Callback Handler] Processing callback with user:", user.email)

        // Dispatch loginSuccess action which will:
        // 1. Update Redux state (token, isAuthenticated)
        // 2. Store token and user in localStorage
        dispatch(
          loginSuccess({
            token,
            user,
          }),
        )

        // Also set user state in Redux user slice
        dispatch(setUser(user))

        console.log("[Google Callback Handler] Auth and user state updated, redirecting to dashboard")

        // Redirect to dashboard
        // Using a small delay to ensure Redux state is updated first
        setTimeout(() => {
          router.push("/dashboard")
        }, 100)
      } catch (error) {
        console.error("[Google Callback Handler] Error:", error)
        const errorMessage =
          error instanceof Error ? error.message : "Failed to process authentication"
        router.push(`/login?error=${encodeURIComponent(errorMessage)}`)
      }
    }

    handleCallback()
  }, [router, searchParams, dispatch])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
        <p className="text-gray-700 font-medium">Completing your login...</p>
      </div>
    </div>
  )
}