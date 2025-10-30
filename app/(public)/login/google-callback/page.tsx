"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppDispatch } from "@/lib/hooks"
import { loginSuccess, loginFailure } from "@/lib/slices/authSlice"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function GoogleCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const errorParam = searchParams.get("error")

        console.log("[Google Callback] Processing callback...")

        if (errorParam) {
          const errorDescription = searchParams.get("error_description") || errorParam
          console.error("[Google Callback] OAuth error:", errorDescription)
          setError(errorDescription)
          setIsProcessing(false)
          return
        }

        if (!code) {
          console.error("[Google Callback] No authorization code received")
          setError("No authorization code received")
          setIsProcessing(false)
          return
        }

        // Verify state for CSRF protection
        const savedState = sessionStorage.getItem("google_oauth_state")
        if (state !== savedState) {
          console.error("[Google Callback] State mismatch - possible CSRF attack")
          setError("Invalid state parameter")
          setIsProcessing(false)
          return
        }

        console.log("[Google Callback] Authorization code received, exchanging for tokens...")

        // Exchange authorization code for tokens on backend
        const response = await fetch("/api/auth/google/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        })

        console.log("[Google Callback] Backend response status:", response.status)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Authentication failed")
        }

        const data = await response.json()
        console.log("[Google Callback] Authentication successful")

        // Update Redux state
        dispatch(
          loginSuccess({
            user: data.user,
            token: data.token,
          }),
        )

        // Clear session storage
        sessionStorage.removeItem("google_oauth_state")

        // Redirect to dashboard
        console.log("[Google Callback] Redirecting to dashboard...")
        router.replace("/dashboard")
      } catch (err) {
        console.error("[Google Callback] Error:", err)
        const errorMessage = err instanceof Error ? err.message : "Authentication failed"
        setError(errorMessage)
        dispatch(loginFailure(errorMessage))
        setIsProcessing(false)
      }
    }

    processCallback()
  }, [searchParams, dispatch, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-lg font-medium">Completing sign in...</p>
                <p className="text-sm text-muted-foreground">Please wait while we authenticate you</p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-destructive font-medium">{error || "Authentication failed"}</p>
              </div>
              <button
                onClick={() => router.push("/login")}
                className="text-primary hover:underline text-sm font-medium"
              >
                Return to login
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}