import { Suspense } from "react"
import GoogleCallbackClient from "./client-handler"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center">
                  <p className="text-lg font-medium">Completing sign in...</p>
                  <p className="text-sm text-muted-foreground">Please wait while we authenticate you</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <GoogleCallbackClient />
    </Suspense>
  )
}