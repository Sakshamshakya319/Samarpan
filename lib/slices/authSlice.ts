import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

interface AuthState {
  token: string | null
  user: any | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  token: null,
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
}

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      console.log("[Auth] Sending login request...")
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      console.log("[Auth] Login response status:", response.status)

      if (!response.ok) {
        const error = await response.json()
        console.log("[Auth] Login error response:", error)
        return rejectWithValue(error.error || "Login failed")
      }

      const data = await response.json()
      console.log("[Auth] Login successful, storing token and user")
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      return { token: data.token, user: data.user }
    } catch (error) {
      console.error("[Auth] Login catch error:", error)
      return rejectWithValue("An error occurred during login")
    }
  },
)

export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async ({ email, password, name }: { email: string; password: string; name: string }, { rejectWithValue }) => {
    try {
      console.log("[Auth] Sending signup request...")
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })

      console.log("[Auth] Signup response status:", response.status)

      if (!response.ok) {
        const error = await response.json()
        console.log("[Auth] Signup error response:", error)
        return rejectWithValue(error.error || "Signup failed")
      }

      const data = await response.json()
      console.log("[Auth] Signup successful, storing token and user")
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      return { token: data.token, user: data.user }
    } catch (error) {
      console.error("[Auth] Signup catch error:", error)
      return rejectWithValue("An error occurred during signup")
    }
  },
)

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      console.log("[Auth] Logging out, clearing state")
      state.token = null
      state.user = null
      state.isAuthenticated = false
      state.error = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        // Clear auth_user cookie immediately for UI update
        document.cookie = "auth_user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
      }
      // Call logout API to clear cookies
      fetch("/api/auth/logout", { method: "POST" }).catch((err) =>
        console.error("[Auth] Logout API call failed:", err),
      )
    },
    loginSuccess: (state, action) => {
      console.log("[Auth] Login success, setting auth state for:", action.payload.user?.email)
      state.token = action.payload.token
      state.user = action.payload.user
      state.isAuthenticated = true
      state.error = null
      state.isLoading = false
      // Ensure localStorage is updated
      if (typeof window !== 'undefined') {
        localStorage.setItem("token", action.payload.token)
        localStorage.setItem("user", JSON.stringify(action.payload.user))
      }
    },
    loginFailure: (state, action) => {
      console.log("[Auth] Login failure:", action.payload)
      state.token = null
      state.user = null
      state.isAuthenticated = false
      state.error = action.payload as string
      state.isLoading = false
    },
    initializeAuth: (state) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem("token")
        const userStr = localStorage.getItem("user")
        
        console.log("[Auth] Initializing auth state:", { hasToken: !!token, hasUser: !!userStr })
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr)
            console.log("[Auth] Restoring auth state for:", user.email)
            state.token = token
            state.user = user
            state.isAuthenticated = true
            state.error = null
          } catch (e) {
            console.error("[Auth] Failed to parse user from localStorage:", e)
            localStorage.removeItem("token")
            localStorage.removeItem("user")
          }
        } else {
          console.log("[Auth] No valid auth data found")
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload as any
        state.token = typeof payload === 'string' ? payload : payload.token
        state.user = typeof payload === 'string' ? null : payload.user
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload as any
        state.token = typeof payload === 'string' ? payload : payload.token
        state.user = typeof payload === 'string' ? null : payload.user
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })
  },
})

export const { logout, initializeAuth, loginSuccess, loginFailure } = authSlice.actions
export default authSlice.reducer
