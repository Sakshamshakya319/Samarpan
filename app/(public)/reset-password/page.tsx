import { ResetPasswordForm } from "@/components/reset-password-form"

export const metadata = {
  title: "Reset Password | Samarpan",
  description: "Reset your Samarpan account password",
}

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <ResetPasswordForm />
    </div>
  )
}