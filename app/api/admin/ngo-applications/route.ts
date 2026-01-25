import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
import { sendEmail, generateNGOApprovalEmailHTML, generateNGORejectionEmailHTML } from "@/lib/email"
import { ObjectId } from "mongodb"

// GET - Fetch all NGO applications
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAdminToken(token)
    if (!decoded || !["admin", "superadmin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Invalid token or insufficient permissions" }, { status: 401 })
    }

    const db = await getDatabase()
    const ngosCollection = db.collection("ngos")

    console.log('Fetching NGO applications from database...')
    
    const applications = await ngosCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`Found ${applications.length} NGO applications`)
    
    return NextResponse.json({ applications }, { status: 200 })

  } catch (error) {
    console.error("Fetch NGO applications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Approve or reject NGO application
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAdminToken(token)
    if (!decoded || !["admin", "superadmin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Invalid token or insufficient permissions" }, { status: 401 })
    }

    const { ngoId, action, rejectionReason } = await request.json()

    if (!ngoId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const ngosCollection = db.collection("ngos")
    const adminsCollection = db.collection("admins")

    // Verify admin exists
    const admin = await adminsCollection.findOne({
      _id: new ObjectId(decoded.adminId),
    })

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    // Find NGO application
    const ngo = await ngosCollection.findOne({ _id: new ObjectId(ngoId) })
    if (!ngo) {
      return NextResponse.json({ error: "NGO application not found" }, { status: 404 })
    }

    // Update NGO status
    const updateData: any = {
      status: action === "approve" ? "approved" : "rejected",
      isVerified: action === "approve",
      reviewedBy: decoded.adminId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    }

    if (action === "reject") {
      updateData.rejectionReason = rejectionReason
    }

    await ngosCollection.updateOne(
      { _id: new ObjectId(ngoId) },
      { $set: updateData }
    )

    // Send email notification (always send for both approve and reject)
    try {
      if (action === "approve") {
        console.log('Sending approval email to:', ngo.ngoEmail)
        const emailHTML = generateNGOApprovalEmailHTML({
          ngoName: ngo.ngoName,
          contactPersonName: ngo.contactPerson.name,
          loginEmail: ngo.ngoEmail,
        })

        const emailSent = await sendEmail({
          to: ngo.ngoEmail,
          subject: "🎉 NGO Application Approved - Welcome to Samarpan!",
          html: emailHTML,
        })
        
        console.log('Approval email sent:', emailSent)
      } else {
        console.log('Sending rejection email to:', ngo.ngoEmail)
        const emailHTML = generateNGORejectionEmailHTML({
          ngoName: ngo.ngoName,
          contactPersonName: ngo.contactPerson.name,
          rejectionReason,
        })

        const emailSent = await sendEmail({
          to: ngo.ngoEmail,
          subject: "NGO Application Status Update - Samarpan",
          html: emailHTML,
        })
        
        console.log('Rejection email sent:', emailSent)
      }
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError)
      // Don't fail the entire operation if email fails
    }

    return NextResponse.json(
      { 
        message: `NGO application ${action}d successfully`,
        status: updateData.status 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("NGO application review error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}