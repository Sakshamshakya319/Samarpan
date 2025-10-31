import { Suspense } from "react"
import GoogleCallbackHandler from "./client-handler"

// Prevent static generation and prerendering
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

export default function GoogleCallbackHandlerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
            <p className="text-gray-700 font-medium">Completing your login...</p>
          </div>
        </div>
      }
    >
      <GoogleCallbackHandler />
    </Suspense>
  )
}