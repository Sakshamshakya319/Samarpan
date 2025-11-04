import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminPermission } from "@/lib/admin-utils"
import { ADMIN_PERMISSIONS } from "@/lib/constants/admin-permissions"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const blogsCollection = db.collection("blogs")

    // Get all published blogs, sorted by date
    const blogs = await blogsCollection
      .find({ status: "published" })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ success: true, blogs })
  } catch (error) {
    console.error("Error fetching blogs:", error)
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[Blog API] POST request received - verifying admin permission for MANAGE_BLOGS")
    
    const verification = await verifyAdminPermission(request, ADMIN_PERMISSIONS.MANAGE_BLOGS)

    if (!verification.valid) {
      console.error("[Blog API] ❌ Authorization failed:", {
        error: verification.error,
        status: verification.status,
      })
      
      // Return 403 Forbidden for permission issues (not 401)
      const status = verification.status === 401 && verification.error?.includes("Permission")
        ? 403
        : verification.status || 401
      
      return NextResponse.json(
        { 
          error: verification.error,
          details: "You do not have permission to create blogs. Contact your administrator.",
        },
        { status },
      )
    }

    const admin = verification.admin
    console.log(`[Blog API] ✅ Admin verified: ${admin.email} (Role: ${admin.role}, IsSuperAdmin: ${verification.isSuperAdmin})`)

    // Validate request body
    const body = await request.json()
    const { title, content, images, status = "draft" } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required and cannot be empty" }, { status: 400 })
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required and cannot be empty" }, { status: 400 })
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "At least one image is required" }, { status: 400 })
    }

    // Check if at least one image is marked as thumbnail
    const hasThumbnail = images.some((img: any) => img.isThumbnail === true)
    if (!hasThumbnail) {
      return NextResponse.json({ error: "One image must be marked as thumbnail" }, { status: 400 })
    }

    // Validate status
    if (!["draft", "published"].includes(status)) {
      return NextResponse.json({ error: "Invalid blog status" }, { status: 400 })
    }

    const db = await getDatabase()
    const blogsCollection = db.collection("blogs")

    const newBlog = {
      title: title.trim(),
      content: content.trim(),
      images, // Array of { url (base64), isThumbnail, caption }
      authorId: admin._id,
      authorName: admin.name,
      authorEmail: admin.email,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      comments: [],
    }

    const result = await blogsCollection.insertOne(newBlog)

    console.log(`✅ Blog created successfully by ${admin.email} (ID: ${admin._id})`)

    return NextResponse.json({
      success: true,
      blog: { _id: result.insertedId, ...newBlog },
    })
  } catch (error) {
    console.error("Error creating blog:", error)
    return NextResponse.json(
      { 
        error: "Failed to create blog",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
}