"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppDispatch } from "@/lib/hooks"
import { loginSuccess, loginFailure } from "@/lib/slices/authSlice"
import { setUser } from "@/lib/slices/userSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

function GoogleCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get("token")
        const userParam = searchParams.get("user")
        const errorParam = searchParams.get("error")

        if (errorParam) {
          setError(decodeURIComponent(errorParam))
          setStatus("error")
          return
        }

        if (!token || !userParam) {
          setError("Missing authentication data")
          setStatus("error")
          return
        }

        // Parse user data
        const user = JSON.parse(decodeURIComponent(userParam))

        // Store in localStorage
        localStorage.setItem("token", token)
        localStorage.setItem("user", JSON.stringify(user))

        // Update Redux state
        dispatch(setUser(user))
        dispatch(loginSuccess({ token, user }))

        setStatus("success")

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)

      } catch (err) {
        console.error("[Google Callback] Error:", err)
        setError("Failed to process authentication")
        setStatus("error")
      }
    }

    handleCallback()
  }, [searchParams, dispatch, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Completing Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Processing your Google authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Sign In Successful!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Welcome to Samarpan!</h3>
                <p className="text-sm text-muted-foreground">
                  You have been successfully signed in. Redirecting to your dashboard...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Sign In Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Authentication Error</h3>
              <p className="text-sm text-muted-foreground">
                {error || "Something went wrong during sign in"}
              </p>
            </div>
          </div>
          <Link href="/login" className="w-full">
            <Button className="w-full">Try Again</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  )
}