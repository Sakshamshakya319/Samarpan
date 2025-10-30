import { store } from "./store"
import { initializeAuth } from "./slices/authSlice"
import { setUser } from "./slices/userSlice"

/**
 * Initialize Redux state from localStorage
 * This should be called once when the app starts (in ReduxProvider or app layout)
 */
export function initializeReduxFromStorage() {
  try {
    // Initialize auth state from localStorage
    store.dispatch(initializeAuth())

    // Also initialize user state from localStorage if it exists
    const userJson = localStorage.getItem("user")
    if (userJson) {
      try {
        const user = JSON.parse(userJson)
        store.dispatch(setUser(user))
      } catch (err) {
        console.warn("[Redux Init] Failed to parse user from localStorage:", err)
      }
    }

    console.log("[Redux Init] Initialized Redux state from localStorage")
  } catch (error) {
    console.error("[Redux Init] Failed to initialize Redux:", error)
  }
}