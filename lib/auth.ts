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

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export function generateAdminToken(adminId: string): string {
  return jwt.sign({ adminId, role: "admin" }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyAdminToken(token: string): { adminId: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { adminId: string; role: string }
  } catch {
    return null
  }
}
