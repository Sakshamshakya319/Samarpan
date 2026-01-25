"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppDispatch } from "@/lib/hooks"
import { loginSuccess } from "@/lib/slices/authSlice"
import { setUser } from "@/lib/slices/userSlice"

export default function GoogleCallbackClientHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()

  useEffect(() => {
    const processAuth = async () => {
      try {
        const token = searchParams.get("token")
        const userParam = searchParams.get("user")

        if (token && userParam) {
          const user = JSON.parse(decodeURIComponent(userParam))
          
          // Store in localStorage
          localStorage.setItem("token", token)
          localStorage.setItem("user", JSON.stringify(user))
          
          // Update Redux
          dispatch(setUser(user))
          dispatch(loginSuccess({ token, user }))
          
          // Redirect to dashboard
          router.replace("/dashboard")
        } else {
          router.push("/login?error=Authentication failed")
        }
      } catch (error) {
        console.error("Auth processing error:", error)
        router.push("/login?error=Authentication failed")
      }
    }

    processAuth()
  }, [searchParams, dispatch, router])

  return null
}