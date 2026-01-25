"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppDispatch } from "@/lib/hooks"
import { loginSuccess, loginFailure } from "@/lib/slices/authSlice"
import { setUser } from "@/lib/slices/userSlice"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function GoogleCallbackClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processCallback = async () => {
      try {
        const token = searchParams.get("token")
        const userParam = searchParams.get("user")
        const errorParam = searchParams.get("error")

        console.log("[Google Callback] Processing callback...")

        if (errorParam) {
          const errorDescription = decodeURIComponent(errorParam)
          console.error("[Google Callback] OAuth error:", errorDescription)
          setError(errorDescription)
          setIsProcessing(false)
          return
        }

        if (!token || !userParam) {
          console.error("[Google Callback] Missing authentication data")
          setError("Missing authentication data")
          setIsProcessing(false)
          return
        }

        console.log("[Google Callback] Authentication data received, processing...")

        // Parse user data
        const user = JSON.parse(decodeURIComponent(userParam))

        // Store in localStorage
        localStorage.setItem("token", token)
        localStorage.setItem("user", JSON.stringify(user))

        // Update Redux state
        dispatch(setUser(user))
        dispatch(
          loginSuccess({
            user: user,
            token: token,
          }),
        )

        console.log("[Google Callback] Authentication successful, redirecting to dashboard...")
        
        // Redirect to dashboard
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