"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface ForgotPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254
}

const REQUEST_TIMEOUT = 30000 // 30 seconds

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate email input
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError("Please enter your email address")
      toast.error("Please enter your email address")
      return
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address")
      toast.error("Please enter a valid email address")
      return
    }

    setLoading(true)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail.toLowerCase() }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (response.ok || response.status === 200) {
        // Success response (200 - could be actual success or security best practice response)
        setSubmitted(true)
        setEmail("")
        toast.success("If an account exists with this email, you'll receive a password reset link shortly.", {
          duration: 5000,
        })
        // Auto-close dialog after delay
        setTimeout(() => {
          setSubmitted(false)
          onOpenChange(false)
        }, 5000)
      } else {
        const errorMsg = data.error || "Failed to send reset email. Please try again."
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error) {
      clearTimeout(timeoutId)
      let errorMsg = "An error occurred. Please check your connection and try again."

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMsg = "Request timed out. Please check your connection and try again."
        } else {
          console.error("Error:", error)
        }
      }

      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when dialog closes
      setEmail("")
      setSubmitted(false)
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>🔐 Reset Password</span>
          </DialogTitle>
          <DialogDescription>
            Enter your email address and we'll send you a secure link to reset your password.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-foreground">Check Your Email!</h3>
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 text-left space-y-2 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-muted-foreground">
                  If an account exists with <span className="font-semibold text-foreground break-all">{email}</span>, you'll receive a password reset link shortly.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>The reset link will expire in 1 hour</li>
                  <li>Check your spam/junk folder if you don't see it</li>
                  <li>Click the link in the email to create a new password</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null) // Clear error when user starts typing
                }}
                disabled={loading}
                required
                autoComplete="email"
              />
              <p className="text-xs text-muted-foreground">
                We'll send a secure password reset link to this address
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              For security reasons, we won't confirm if an account exists with this email.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}