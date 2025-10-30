"use client"

import { useEffect } from "react"
import { Provider } from "react-redux"
import { store } from "@/lib/store"
import { initializeAuth } from "@/lib/slices/authSlice"
import { setUser } from "@/lib/slices/userSlice"
import type React from "react"

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize auth state from localStorage on client side
    store.dispatch(initializeAuth())

    // Also initialize user state from localStorage if it exists
    const userJson = localStorage.getItem("user")
    if (userJson) {
      try {
        const user = JSON.parse(userJson)
        store.dispatch(setUser(user))
        console.log("[Redux Init] User state initialized from localStorage")
      } catch (err) {
        console.warn("[Redux Init] Failed to parse user from localStorage:", err)
      }
    }
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
