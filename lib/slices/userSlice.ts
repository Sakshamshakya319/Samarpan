import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

interface UserData {
  _id: string
  name: string
  email: string
  bloodGroup?: string
  location?: string
  phone?: string
  lastDonationDate?: string | null
  hasDisease?: boolean
  diseaseDescription?: string
  totalDonations?: number
  avatar?: string
  role?: string
}

interface UserState {
  data: UserData | null
  isLoading: boolean
  error: string | null
}

const initialState: UserState = {
  data: null,
  isLoading: false,
  error: null,
}

export const fetchUserProfile = createAsyncThunk("user/fetchProfile", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      return rejectWithValue("No authentication token found")
    }

    const response = await fetch("/api/users/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return rejectWithValue(error.error || "Failed to fetch user profile")
    }

    const data = await response.json()
    localStorage.setItem("user", JSON.stringify(data.user))
    return data.user
  } catch (error) {
    return rejectWithValue("Failed to fetch user profile")
  }
})

export const updateUserProfile = createAsyncThunk(
  "user/updateProfile",
  async (userData: Partial<UserData>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.error || "Failed to update profile")
      }

      const data = await response.json()
      localStorage.setItem("user", JSON.stringify(data.user))
      return data.user
    } catch (error) {
      return rejectWithValue("An error occurred while updating profile")
    }
  },
)

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUser: (state) => {
      state.data = null
      state.error = null
    },
    setUser: (state, action) => {
      state.data = action.payload
      state.error = null
      state.isLoading = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.data = action.payload
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.data = action.payload
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearUser, setUser } = userSlice.actions
export default userSlice.reducer
