"use client"

import { useEffect } from "react"
import { Provider } from "react-redux"
import { store } from "@/lib/store"
import { initializeAuth } from "@/lib/slices/authSlice"
import type React from "react"

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log("[Redux Provider] Initializing auth state...")
    
    // Small delay to ensure localStorage is available
    const initAuth = () => {
      try {
        store.dispatch(initializeAuth())
      } catch (error) {
        console.error("[Redux Provider] Failed to initialize auth:", error)
      }
    }
    
    // Initialize immediately and also after a small delay
    initAuth()
    setTimeout(initAuth, 100)
  }, [])

  return <>{children}</>
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  )
}
