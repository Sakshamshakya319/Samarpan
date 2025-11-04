import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminPermission } from "@/lib/admin-utils"

const jwtSecret = process.env.JWT_SECRET || ""

// Verify user token
function verifyUserToken(token: string): any {
  try {
    const decoded = jwt.verify(token, jwtSecret) as any
    return decoded
  } catch {
    return null
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Try to verify as admin first
    const adminVerification = await verifyAdminPermission(request)
    const admin = adminVerification.valid ? adminVerification.admin : null
    const userToken = !admin ? verifyUserToken(token) : null

    if (!admin && !userToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const blogsCollection = db.collection("blogs")

    // Get the blog and find the comment
    const blog = await blogsCollection.findOne({ _id: new ObjectId(id) })

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    const comment = blog.comments?.find((c: any) => c._id.toString() === commentId)

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check authorization: user can delete their own comment, admin can delete any
    const isOwnComment = userToken && comment.userId.toString() === userToken.userId
    const isAdminUser = admin !== null

    if (!isOwnComment && !isAdminUser) {
      return NextResponse.json({ error: "You can only delete your own comments" }, { status: 403 })
    }

    // Remove the comment
    await blogsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $pull: { comments: { _id: new ObjectId(commentId) } } }
    )

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
  }
}