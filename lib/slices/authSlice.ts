import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

interface AuthState {
  token: string | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
}

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      console.log("[v0] Sending login request...")
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      console.log("[v0] Login response status:", response.status)

      if (!response.ok) {
        const error = await response.json()
        console.log("[v0] Login error response:", error)
        return rejectWithValue(error.error || "Login failed")
      }

      const data = await response.json()
      console.log("[v0] Login successful, storing token and user")
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      return { token: data.token, user: data.user }
    } catch (error) {
      console.error("[v0] Login catch error:", error)
      return rejectWithValue("An error occurred during login")
    }
  },
)

export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async ({ email, password, name }: { email: string; password: string; name: string }, { rejectWithValue }) => {
    try {
      console.log("[v0] Sending signup request...")
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })

      console.log("[v0] Signup response status:", response.status)

      if (!response.ok) {
        const error = await response.json()
        console.log("[v0] Signup error response:", error)
        return rejectWithValue(error.error || "Signup failed")
      }

      const data = await response.json()
      console.log("[v0] Signup successful, storing token and user")
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      return { token: data.token, user: data.user }
    } catch (error) {
      console.error("[v0] Signup catch error:", error)
      return rejectWithValue("An error occurred during signup")
    }
  },
)

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null
      state.isAuthenticated = false
      state.error = null
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      // Call logout API to clear cookies
      fetch("/api/auth/logout", { method: "POST" }).catch((err) =>
        console.error("[v0] Logout API call failed:", err),
      )
    },
    initializeAuth: (state) => {
      const token = localStorage.getItem("token")
      if (token) {
        state.token = token
        state.isAuthenticated = true
      }
    },
    loginSuccess: (state, action) => {
      state.token = action.payload.token
      state.isAuthenticated = true
      state.error = null
      state.isLoading = false
      localStorage.setItem("token", action.payload.token)
      localStorage.setItem("user", JSON.stringify(action.payload.user))
    },
    loginFailure: (state, action) => {
      state.token = null
      state.isAuthenticated = false
      state.error = action.payload as string
      state.isLoading = false
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
        // Handle both old format (just token) and new format (token + user)
        const payload = action.payload as any
        state.token = typeof payload === 'string' ? payload : payload.token
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
        // Handle both old format (just token) and new format (token + user)
        const payload = action.payload as any
        state.token = typeof payload === 'string' ? payload : payload.token
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
