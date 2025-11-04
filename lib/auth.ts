import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

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
