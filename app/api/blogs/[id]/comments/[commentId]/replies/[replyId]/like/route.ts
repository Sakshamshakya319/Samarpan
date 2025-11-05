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
  { params }: { params: Promise<{ id: string; commentId: string; replyId: string }> }
) {
  try {
    const { id, commentId, replyId } = await params

    if (!ObjectId.isValid(id) || !ObjectId.isValid(commentId) || !ObjectId.isValid(replyId)) {
      return NextResponse.json(
        { error: "Invalid blog, comment, or reply ID" },
        { status: 400 }
      )
    }

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized - please login" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const userToken = verifyUserToken(token)

    if (!userToken) {
      return NextResponse.json({ error: "Invalid user token" }, { status: 401 })
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
    const replyIndex = comment.replies?.findIndex((r: any) => r._id.toString() === replyId)

    if (replyIndex === -1) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 })
    }

    const reply = comment.replies[replyIndex]
    const likes = reply.likes || []
    const userLikeIndex = likes.indexOf(userToken.userId)

    let updatedComments: any[]

    if (userLikeIndex > -1) {
      // Unlike: remove user ID from likes
      updatedComments = blog.comments.map((c: any, idx: number) => {
        if (idx === commentIndex) {
          return {
            ...c,
            replies: c.replies?.map((r: any, rIdx: number) => {
              if (rIdx === replyIndex) {
                return {
                  ...r,
                  likes: r.likes?.filter((id: string) => id !== userToken.userId) || [],
                }
              }
              return r
            }) || [],
          }
        }
        return c
      })
    } else {
      // Like: add user ID to likes
      updatedComments = blog.comments.map((c: any, idx: number) => {
        if (idx === commentIndex) {
          return {
            ...c,
            replies: c.replies?.map((r: any, rIdx: number) => {
              if (rIdx === replyIndex) {
                return {
                  ...r,
                  likes: [...(r.likes || []), userToken.userId],
                }
              }
              return r
            }) || [],
          }
        }
        return c
      })
    }

    await blogsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { comments: updatedComments } }
    )

    return NextResponse.json({
      success: true,
      liked: userLikeIndex === -1,
      message: userLikeIndex === -1 ? "Reply liked" : "Reply unliked",
    })
  } catch (error) {
    console.error("[Blog Comments] Error liking reply:", error)
    return NextResponse.json({ error: "Failed to like reply" }, { status: 500 })
  }
}