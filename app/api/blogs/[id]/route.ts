import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminPermission } from "@/lib/admin-utils"
import { ADMIN_PERMISSIONS } from "@/lib/constants/admin-permissions"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid blog ID" }, { status: 400 })
    }

    const db = await getDatabase()
    const blogsCollection = db.collection("blogs")

    // Update view count
    const blog = await blogsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $inc: { views: 1 } },
      { returnDocument: "after" }
    )

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, blog })
  } catch (error) {
    console.error("Error fetching blog:", error)
    return NextResponse.json({ error: "Failed to fetch blog" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid blog ID" }, { status: 400 })
    }

    const verification = await verifyAdminPermission(request, ADMIN_PERMISSIONS.MANAGE_BLOGS)

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error },
        { status: verification.status || 401 },
      )
    }

    const admin = verification.admin
    const body = await request.json()
    const { title, content, images, status } = body

    const db = await getDatabase()
    const blogsCollection = db.collection("blogs")

    // Check if blog exists and belongs to this admin or is superadmin
    const blog = await blogsCollection.findOne({ _id: new ObjectId(id) })

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    if (blog.authorId.toString() !== admin._id.toString() && admin.role !== "superadmin") {
      return NextResponse.json({ error: "You can only edit your own blogs" }, { status: 403 })
    }

    const updateData: any = { updatedAt: new Date() }
    if (title) updateData.title = title
    if (content) updateData.content = content
    if (images) {
      const hasThumbnail = images.some((img: any) => img.isThumbnail)
      if (!hasThumbnail) {
        return NextResponse.json({ error: "One image must be marked as thumbnail" }, { status: 400 })
      }
      updateData.images = images
    }
    if (status) updateData.status = status

    const result = await blogsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    )

    return NextResponse.json({
      success: true,
      blog: result,
    })
  } catch (error) {
    console.error("Error updating blog:", error)
    return NextResponse.json({ error: "Failed to update blog" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid blog ID" }, { status: 400 })
    }

    const verification = await verifyAdminPermission(request, ADMIN_PERMISSIONS.MANAGE_BLOGS)

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error },
        { status: verification.status || 401 },
      )
    }

    const admin = verification.admin
    const db = await getDatabase()
    const blogsCollection = db.collection("blogs")

    // Check if blog exists and belongs to this admin or is superadmin
    const blog = await blogsCollection.findOne({ _id: new ObjectId(id) })

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    if (blog.authorId.toString() !== admin._id.toString() && admin.role !== "superadmin") {
      return NextResponse.json({ error: "You can only delete your own blogs" }, { status: 403 })
    }

    await blogsCollection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true, message: "Blog deleted successfully" })
  } catch (error) {
    console.error("Error deleting blog:", error)
    return NextResponse.json({ error: "Failed to delete blog" }, { status: 500 })
  }
}