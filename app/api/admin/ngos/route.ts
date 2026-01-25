import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email"

// GET - List all NGO registrations for admin review
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build filter
    const filter: any = {}
    if (status !== 'all') {
      filter.status = status
    }

    // Get NGOs with pagination
    const ngos = await ngosCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .project({ password: 0 }) // Exclude password from response
      .toArray()

    const total = await ngosCollection.countDocuments(filter)

    return NextResponse.json({
      ngos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 })

  } catch (error) {
    console.error("Get NGOs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Approve or reject NGO registration
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

    const { ngoId, action, remarks } = await request.json()

    if (!ngoId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    if (action === 'reject' && !remarks) {
      return NextResponse.json({ error: "Remarks are required for rejection" }, { status: 400 })
    }

    const db = await getDatabase()
    const ngosCollection = db.collection("ngos")
    const adminsCollection = db.collection("admins")

    // Get admin details
    const admin = await adminsCollection.findOne({ _id: new ObjectId(decoded.adminId) })
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    // Get NGO details
    const ngo = await ngosCollection.findOne({ _id: new ObjectId(ngoId) })
    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 })
    }

    // Update NGO status
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      isVerified: action === 'approve',
      reviewedBy: admin.name,
      reviewedAt: new Date(),
      updatedAt: new Date()
    }

    if (remarks) {
      updateData.adminRemarks = remarks
    }

    await ngosCollection.updateOne(
      { _id: new ObjectId(ngoId) },
      { $set: updateData }
    )

    // Send email notification
    if (action === 'approve') {
      await sendEmail({
        to: ngo.email,
        subject: "🎉 NGO Registration Approved - Welcome to Samarpan!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
            <div style="background: white; border-radius: 10px; padding: 40px; text-align: center;">
              <h1 style="color: #2563eb; margin-bottom: 20px;">🎉 Congratulations!</h1>
              <h2 style="color: #1f2937; margin-bottom: 30px;">Your NGO has been Successfully Verified</h2>
              
              <div style="background: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; margin: 30px 0; text-align: left;">
                <h3 style="color: #1e40af; margin-top: 0;">NGO Details:</h3>
                <p><strong>Name:</strong> ${ngo.ngoName}</p>
                <p><strong>Registration Number:</strong> ${ngo.registrationNumber}</p>
                <p><strong>Email:</strong> ${ngo.email}</p>
                <p><strong>Location:</strong> ${ngo.city}, ${ngo.state}</p>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 20px 0;">
                Welcome to the Samarpan family! You can now log in to your NGO account and start managing blood donation activities, organizing camps, and making a difference in your community.
              </p>
              
              <div style="margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/ngo/login" 
                   style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Login to Your Account
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                If you have any questions, please contact us at admin@samarpan.com
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #6b7280; font-size: 14px;">
                Best regards,<br>
                <strong>Samarpan Team</strong><br>
                Connecting Lives, Saving Lives
              </p>
            </div>
          </div>
        `
      })
    } else {
      await sendEmail({
        to: ngo.email,
        subject: "NGO Registration Update - Samarpan",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Registration Status Update</h2>
            <p>Dear ${ngo.ngoName},</p>
            <p>Thank you for your interest in joining Samarpan. After reviewing your application, we are unable to approve your NGO registration at this time.</p>
            
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
              <h3 style="color: #dc2626;">Reason for Rejection:</h3>
              <p>${remarks}</p>
            </div>
            
            <p>If you believe this is an error or would like to resubmit your application with additional information, please contact us at admin@samarpan.com</p>
            
            <p>Best regards,<br>Samarpan Team</p>
          </div>
        `
      })
    }

    return NextResponse.json({
      message: `NGO ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      ngo: {
        id: ngo._id,
        ngoName: ngo.ngoName,
        status: updateData.status,
        reviewedBy: updateData.reviewedBy,
        reviewedAt: updateData.reviewedAt
      }
    }, { status: 200 })

  } catch (error) {
    console.error("NGO approval/rejection error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}