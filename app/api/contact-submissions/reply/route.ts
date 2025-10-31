import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { submissionId, reply, adminEmail } = body

    if (!submissionId || !reply) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const contactSubmissions = db.collection("contactSubmissions")

    // Get the submission
    const submission = await contactSubmissions.findOne({
      _id: new ObjectId(submissionId),
    })

    if (!submission) {
      return Response.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    // Update submission with reply
    const updateResult = await contactSubmissions.updateOne(
      { _id: new ObjectId(submissionId) },
      {
        $set: {
          status: "replied",
          adminReply: reply,
          adminRepliedAt: new Date(),
          adminRepliedBy: adminEmail || "admin@samarpan.com",
        },
      }
    )

    // Send reply email to user
    try {
      await sendEmail({
        to: submission.email,
        subject: `Re: ${submission.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Response to Your Message</h2>
            <p>Hi ${submission.name},</p>
            <p style="margin: 20px 0;">Thank you for contacting us. Here's our response to your inquiry:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${reply}</p>
            </div>

            <p style="margin-top: 20px;">Best regards,<br><strong>Samarpan Admin Team</strong></p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              <strong>Original Message:</strong><br>
              Subject: ${submission.subject}<br>
              Received: ${new Date(submission.createdAt).toLocaleString()}
            </p>
          </div>
        `,
        text: `Response to Your Message\n\nHi ${submission.name},\n\nThank you for contacting us. Here's our response to your inquiry:\n\n${reply}\n\nBest regards,\nSamarpan Admin Team`,
      })
    } catch (emailError) {
      console.error("Failed to send reply email:", emailError)
    }

    return Response.json(
      {
        success: true,
        message: "Reply sent successfully",
        updatedSubmission: await contactSubmissions.findOne({
          _id: new ObjectId(submissionId),
        }),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Reply error:", error)
    return Response.json(
      { error: "Failed to send reply" },
      { status: 500 }
    )
  }
}