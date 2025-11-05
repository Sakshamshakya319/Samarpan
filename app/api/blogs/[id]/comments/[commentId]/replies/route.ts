import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"
import { getDatabase } from "@/lib/mongodb"

const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production"

function verifyUserToken(token: string): any {
  try {
    return jwt.verify(token, jwtSecret) as any
  } catch {
    return null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params

    if (!ObjectId.isValid(id) || !ObjectId.isValid(commentId)) {
      return NextResponse.json({ error: "Invalid blog or comment ID" }, { status: 400 })
    }

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - please login to reply" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const userToken = verifyUserToken(token)

    if (!userToken) {
      return NextResponse.json({ error: "Invalid user token" }, { status: 401 })
    }

    const body = await request.json()
    const { text } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Reply text is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const blogsCollection = db.collection("blogs")
    const usersCollection = db.collection("users")

    // Get user info
    const user = await usersCollection.findOne({ _id: new ObjectId(userToken.userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the blog and find the comment
    const blog = await blogsCollection.findOne({ _id: new ObjectId(id) })

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    const commentIndex = blog.comments?.findIndex((c: any) => c._id.toString() === commentId)

    if (commentIndex === -1) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    const reply = {
      _id: new ObjectId(),
      userId: new ObjectId(userToken.userId),
      userName: user.name || "Anonymous",
      userEmail: user.email,
      text,
      createdAt: new Date(),
      likes: [],
    }

    // Add reply to the comment's replies array
    const updatedComments = [...blog.comments]
    updatedComments[commentIndex] = {
      ...updatedComments[commentIndex],
      replies: [...(updatedComments[commentIndex].replies || []), reply],
    }

    await blogsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { comments: updatedComments } }
    )

    return NextResponse.json({
      success: true,
      reply,
    })
  } catch (error) {
    console.error("[Blog Comments] Error adding reply:", error)
    return NextResponse.json({ error: "Failed to add reply" }, { status: 500 })
  }
}