import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { ReduxProvider } from "@/components/redux-provider"
import { Toaster } from "@/components/ui/sonner"
import { Toaster as ToastToaster } from "@/components/ui/toaster"

// Configure Google Fonts
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

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
      <body className={`${inter.variable} ${playfairDisplay.variable} font-sans antialiased`}>
        <ReduxProvider>{children}</ReduxProvider>
        <Toaster />
        <ToastToaster />
        <Analytics />
      </body>
    </html>
  )
}
