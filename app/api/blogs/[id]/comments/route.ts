import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"
import { getDatabase } from "@/lib/mongodb"

const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Verify user token
function verifyUserToken(token: string): any {
  try {
    const decoded = jwt.verify(token, jwtSecret) as any
    return decoded
  } catch (error) {
    console.error("[Blog Comments] Token verification failed:", error)
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid blog ID" }, { status: 400 })
    }

    const db = await getDatabase()
    const blogsCollection = db.collection("blogs")

    const blog = await blogsCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { comments: 1 } }
    )

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      comments: blog.comments || [],
    })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid blog ID" }, { status: 400 })
    }

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized - please login to comment" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const userToken = verifyUserToken(token)

    if (!userToken) {
      return NextResponse.json({ error: "Invalid user token" }, { status: 401 })
    }

    const body = await request.json()
    const { text } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const blogsCollection = db.collection("blogs")
    const usersCollection = db.collection("users")

    // Get user info
    const user = await usersCollection.findOne({ _id: new ObjectId(userToken.userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const comment = {
      _id: new ObjectId(),
      userId: new ObjectId(userToken.userId),
      userName: user.name || "Anonymous",
      userEmail: user.email,
      text,
      createdAt: new Date(),
    }

    const result = await blogsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $push: { comments: comment } },
      { returnDocument: "after" }
    )

    if (!result) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      comment,
    })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}