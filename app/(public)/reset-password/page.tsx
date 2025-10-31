import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/reset-password-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Reset Password | Samarpan",
  description: "Reset your Samarpan account password",
}

function LoadingFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verify Reset Link</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Verifying your reset link...</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Suspense fallback={<LoadingFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}