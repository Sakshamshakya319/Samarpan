import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email"

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAdminToken(token)
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ error: "Only super admins can pause/resume NGOs" }, { status: 403 })
    }

    const { ngoId, action, reason } = await request.json()

    if (!ngoId || !action || (action === 'pause' && !reason)) {
      return NextResponse.json({ 
        error: "NGO ID, action, and reason (for pause) are required" 
      }, { status: 400 })
    }

    if (!['pause', 'resume'].includes(action)) {
      return NextResponse.json({ error: "Action must be 'pause' or 'resume'" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const ngosCollection = db.collection("ngos")

    // Find the NGO
    const ngo = await ngosCollection.findOne({ _id: new ObjectId(ngoId) })
    
    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 })
    }

    if (ngo.status !== 'approved') {
      return NextResponse.json({ error: "Can only pause/resume approved NGOs" }, { status: 400 })
    }

    const now = new Date()
    let updateData: any = {}
    let emailSubject = ""
    let emailContent = ""

    if (action === 'pause') {
      if (ngo.isPaused) {
        return NextResponse.json({ error: "NGO is already paused" }, { status: 400 })
      }

      updateData = {
        isPaused: true,
        pausedBy: decoded.adminId,
        pausedAt: now,
        pauseReason: reason,
        updatedAt: now
      }

      emailSubject = "🚨 Account Temporarily Suspended - Samarpan"
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 28px;">Account Suspended</h1>
              <div style="width: 60px; height: 4px; background-color: #dc2626; margin: 10px auto;"></div>
            </div>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h2 style="color: #dc2626; margin: 0 0 10px 0; font-size: 18px;">⚠️ Important Notice</h2>
              <p style="color: #7f1d1d; margin: 0; line-height: 1.6;">
                Your NGO account "${ngo.ngoName}" has been temporarily suspended by our administration team.
              </p>
            </div>

            <div style="margin: 25px 0;">
              <h3 style="color: #374151; margin: 0 0 15px 0;">Suspension Details:</h3>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px;">
                <p style="margin: 0; color: #6b7280;"><strong>Reason:</strong> ${reason}</p>
                <p style="margin: 10px 0 0 0; color: #6b7280;"><strong>Date:</strong> ${now.toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>

            <div style="background-color: #fffbeb; border: 1px solid #fbbf24; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #92400e; margin: 0 0 10px 0;">What this means:</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>You can still log in to your account</li>
                <li>All NGO functions and activities are temporarily disabled</li>
                <li>You cannot perform any operations until the suspension is lifted</li>
                <li>This is a temporary measure while we review your account</li>
              </ul>
            </div>

            <div style="margin: 25px 0;">
              <h3 style="color: #374151; margin: 0 0 15px 0;">Next Steps:</h3>
              <p style="color: #6b7280; line-height: 1.6; margin: 0 0 15px 0;">
                If you believe this suspension is in error or would like to discuss this matter, please contact our support team immediately.
              </p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="mailto:support@samarpan.com" style="background-color: #dc2626; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Contact Support</a>
              </div>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                This is an automated message from the Samarpan Team<br>
                Please do not reply to this email
              </p>
            </div>
          </div>
        </div>
      `
    } else { // resume
      if (!ngo.isPaused) {
        return NextResponse.json({ error: "NGO is not paused" }, { status: 400 })
      }

      updateData = {
        isPaused: false,
        resumedBy: decoded.adminId,
        resumedAt: now,
        updatedAt: now
      }

      emailSubject = "✅ Account Reactivated - Welcome Back to Samarpan"
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0fdf4;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-center; margin-bottom: 30px;">
              <h1 style="color: #059669; margin: 0; font-size: 32px;">🎉 Welcome Back!</h1>
              <div style="width: 80px; height: 4px; background-color: #059669; margin: 15px auto;"></div>
              <h2 style="color: #047857; margin: 10px 0; font-size: 24px;">Account Successfully Reactivated</h2>
            </div>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 25px; margin: 25px 0; border-radius: 5px;">
              <h2 style="color: #059669; margin: 0 0 15px 0; font-size: 20px;">🚀 Great News!</h2>
              <p style="color: #166534; margin: 0; line-height: 1.8; font-size: 16px;">
                Your NGO account "<strong>${ngo.ngoName}</strong>" has been successfully reactivated and is now fully operational. 
                You can immediately resume all blood donation activities and NGO operations.
              </p>
            </div>

            <div style="margin: 30px 0;">
              <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 18px;">📋 Reactivation Summary:</h3>
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">NGO Name:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${ngo.ngoName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Reactivated on:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${now.toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Previous suspension:</td>
                    <td style="padding: 8px 0; color: #111827;">${ngo.pauseReason || 'Administrative review completed'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Status:</td>
                    <td style="padding: 8px 0;"><span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">✅ Fully Active</span></td>
                  </tr>
                </table>
              </div>
            </div>

            <div style="background-color: #f0fdf4; border: 2px solid #22c55e; padding: 25px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 18px;">🎯 You Can Now:</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="color: #22c55e; font-size: 18px;">📅</span>
                  <span style="color: #166534; font-size: 14px;">Organize blood donation camps</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="color: #22c55e; font-size: 18px;">👥</span>
                  <span style="color: #166534; font-size: 14px;">Manage donor registrations</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="color: #22c55e; font-size: 18px;">❤️</span>
                  <span style="color: #166534; font-size: 14px;">Respond to blood requests</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="color: #22c55e; font-size: 18px;">⚙️</span>
                  <span style="color: #166534; font-size: 14px;">Update NGO profile & settings</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="color: #22c55e; font-size: 18px;">📢</span>
                  <span style="color: #166534; font-size: 14px;">Send notifications to users</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="color: #22c55e; font-size: 18px;">📊</span>
                  <span style="color: #166534; font-size: 14px;">Access full dashboard features</span>
                </div>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/ngo/dashboard" 
                 style="background-color: #059669; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                🚀 Access Your Dashboard Now
              </a>
            </div>

            <div style="background-color: #fffbeb; border: 1px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">💡 Moving Forward:</h3>
              <p style="color: #92400e; margin: 0; line-height: 1.6; font-size: 14px;">
                Thank you for your patience during the review process. We're committed to maintaining a safe and trustworthy platform 
                for all our users. If you have any questions or need assistance getting back up to speed, our support team is here to help.
              </p>
            </div>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">📞 Need Support?</h3>
              <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
                Our team is available to help you get back to making a difference:
              </p>
              <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <a href="mailto:support@samarpan.com" style="color: #059669; text-decoration: none; font-weight: 500;">📧 support@samarpan.com</a>
                <a href="tel:+911234567890" style="color: #059669; text-decoration: none; font-weight: 500;">📞 +91 123 456 7890</a>
              </div>
            </div>

            <div style="border-top: 2px solid #e5e7eb; padding-top: 25px; margin-top: 35px; text-align: center;">
              <h3 style="color: #059669; margin: 0 0 10px 0; font-size: 18px;">Welcome Back to the Samarpan Family! 🏠</h3>
              <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.6;">
                Together, we continue our mission to save lives through blood donation.<br>
                Thank you for being a vital part of our community.
              </p>
              <div style="margin-top: 15px;">
                <span style="color: #dc2626; font-size: 20px;">❤️</span>
                <span style="color: #374151; font-weight: 600; margin: 0 10px;">Samarpan Team</span>
                <span style="color: #dc2626; font-size: 20px;">❤️</span>
              </div>
            </div>
          </div>
        </div>
      `
    }

    // Update the NGO
    const result = await ngosCollection.updateOne(
      { _id: new ObjectId(ngoId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Failed to update NGO" }, { status: 500 })
    }

    // Send email notification
    try {
      await sendEmail({
        to: ngo.ngoEmail,
        subject: emailSubject,
        html: emailContent
      })
      console.log(`${action} email sent to NGO: ${ngo.ngoEmail}`)
    } catch (emailError) {
      console.error(`Failed to send ${action} email:`, emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      message: `NGO ${action}d successfully`,
      ngo: {
        _id: ngo._id,
        ngoName: ngo.ngoName,
        isPaused: action === 'pause',
        [action === 'pause' ? 'pausedAt' : 'resumedAt']: now
      }
    })

  } catch (error) {
    console.error(`NGO pause/resume error:`, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}