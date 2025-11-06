import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ReduxProvider } from "@/components/redux-provider"
import { Toaster } from "@/components/ui/sonner"

// NOTE: Removed Google font imports (Geist, Geist Mono) to avoid
// build-time network fetches in restricted/offline environments.
// The app will use system fonts via Tailwind's `font-sans` and
// monospace fallbacks defined in globals.css.

export const metadata: Metadata = {
  title: "Samarpan - Blood Donor Platform",
  description: "Connect donors and patients to save lives",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ReduxProvider>{children}</ReduxProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
