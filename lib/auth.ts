import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET || "your-reset-token-secret-change-in-production"

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(userId: string, email?: string): string {
  const payload: any = { userId }
  if (email) {
    payload.email = email
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): { userId: string; email?: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email?: string }
  } catch {
    return null
  }
}

export function generateAdminToken(
  adminId: string,
  role: string = "admin",
  email?: string,
): string {
  const payload: any = { adminId, role }
  if (email) {
    payload.email = email
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyAdminToken(token: string): {
  adminId: string
  role: string
  email?: string
} | null {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      adminId: string
      role: string
      email?: string
    }
  } catch {
    return null
  }
}

// Password Reset Token Functions
export function generateResetToken(email: string): { token: string; hashedToken: string } {
  // Generate a random token
  const token = crypto.randomBytes(32).toString('hex')
  
  // Create a payload with email and timestamp
  const payload = {
    email,
    token,
    timestamp: Date.now()
  }
  
  // Sign the payload to create a secure token
  const secureToken = jwt.sign(payload, RESET_TOKEN_SECRET, { expiresIn: '1h' })
  
  // Hash the token for database storage
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
  
  return {
    token: secureToken,
    hashedToken
  }
}

export function verifyResetToken(token: string): { email: string; tokenHash: string } | null {
  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, RESET_TOKEN_SECRET) as {
      email: string
      token: string
      timestamp: number
    }
    
    // Check if token is not expired (1 hour)
    const now = Date.now()
    const tokenAge = now - decoded.timestamp
    const oneHour = 60 * 60 * 1000
    
    if (tokenAge > oneHour) {
      console.log('[Reset Token] Token expired:', { tokenAge, oneHour })
      return null
    }
    
    // Hash the original token for comparison
    const tokenHash = crypto.createHash('sha256').update(decoded.token).digest('hex')
    
    return {
      email: decoded.email,
      tokenHash
    }
  } catch (error) {
    console.log('[Reset Token] Verification failed:', error.message)
    return null
  }
}

// Google OAuth Token Functions
export function generateGoogleToken(googleId: string, email: string, name: string): string {
  const payload = {
    googleId,
    email,
    name,
    provider: 'google'
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyGoogleToken(token: string): {
  googleId: string
  email: string
  name: string
  provider: string
} | null {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      googleId: string
      email: string
      name: string
      provider: string
    }
  } catch {
    return null
  }
}
