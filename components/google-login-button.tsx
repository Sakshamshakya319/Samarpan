"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle } from "lucide-react"

interface GoogleLoginButtonProps {
  mode?: "signin" | "signup"
}

export function GoogleLoginButton({ mode = "signin" }: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleGoogleLogin = useCallback(() => {
    try {
      setIsLoading(true)
      setError(null)

      // Redirect to server-side auth route
      // This ensures consistent redirect_uri generation and secure state handling
      window.location.href = '/api/auth/google'

    } catch (err) {
      console.error("[Google Login] Error:", err)
      setError("Failed to start Google authentication")
      setIsLoading(false)
    }
  }, [])

  const buttonText = mode === "signup" ? "Sign up with Google" : "Sign in with Google"
  const loadingText = mode === "signup" ? "Redirecting..." : "Redirecting..."

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full h-11 font-medium text-base border-2 hover:bg-gray-50 transition-colors"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {loadingText}
          </>
        ) : (
          <>
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="bg-gradient-to-r from-blue-600 via-green-500 to-red-500 bg-clip-text text-transparent">
              {buttonText}
            </span>
          </>
        )}
      </Button>
      <p className="text-xs text-gray-500 text-center">
        We'll never post without your permission
      </p>
    </div>
  )
}