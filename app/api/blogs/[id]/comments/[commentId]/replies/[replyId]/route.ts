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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string; replyId: string }> }
) {
  try {
    const { id, commentId, replyId } = await params

    if (!ObjectId.isValid(id) || !ObjectId.isValid(commentId) || !ObjectId.isValid(replyId)) {
      return NextResponse.json({ error: "Invalid blog, comment, or reply ID" }, { status: 400 })
    }

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const userToken = verifyUserToken(token)

    if (!userToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const blogsCollection = db.collection("blogs")

    // Get the blog and find the comment and reply
    const blog = await blogsCollection.findOne({ _id: new ObjectId(id) })

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    const commentIndex = blog.comments?.findIndex((c: any) => c._id.toString() === commentId)

    if (commentIndex === -1) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    const comment = blog.comments[commentIndex]
    const reply = comment.replies?.find((r: any) => r._id.toString() === replyId)

    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 })
    }

    // Check authorization: user can delete their own reply
    if (reply.userId.toString() !== userToken.userId) {
      return NextResponse.json(
        { error: "You can only delete your own replies" },
        { status: 403 }
      )
    }

    // Remove the reply
    const updatedComments = [...blog.comments]
    updatedComments[commentIndex] = {
      ...updatedComments[commentIndex],
      replies: (updatedComments[commentIndex].replies || []).filter(
        (r: any) => r._id.toString() !== replyId
      ),
    }

    await blogsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { comments: updatedComments } }
    )

    return NextResponse.json({
      success: true,
      message: "Reply deleted successfully",
    })
  } catch (error) {
    console.error("[Blog Comments] Error deleting reply:", error)
    return NextResponse.json({ error: "Failed to delete reply" }, { status: 500 })
  }
}