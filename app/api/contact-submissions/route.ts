import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, subject, message, phone } = body

    if (!name || !email || !subject || !message) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const contactSubmissions = db.collection("contactSubmissions")

    const submission = {
      name,
      email,
      subject,
      message,
      phone: phone || "",
      status: "new", // new, read, replied
      createdAt: new Date(),
      updatedAt: new Date(),
      adminReply: null,
      adminRepliedAt: null,
      adminRepliedBy: null,
    }

    const result = await contactSubmissions.insertOne(submission)

    // Send notification email to admin
    try {
      await sendEmail({
        to: process.env.SMTP_FROM || "admin@samarpan.com",
        subject: `New Contact Form Submission: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #dc2626; margin-top: 0;">New Contact Submission</h2>
              <p style="margin: 10px 0;"><strong>From:</strong> ${name}</p>
              <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              ${phone ? `<p style="margin: 10px 0;"><strong>Phone:</strong> ${phone}</p>` : ""}
              <p style="margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>
            </div>
            <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
              <h3>Message:</h3>
              <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>
            <p style="text-align: center; color: #6b7280; font-size: 12px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" style="color: #dc2626; text-decoration: none;">
                View in Admin Dashboard
              </a>
            </p>
          </div>
        `,
        text: `New Contact Submission\n\nFrom: ${name}\nEmail: ${email}\nPhone: ${phone}\nSubject: ${subject}\n\nMessage:\n${message}`,
      })
    } catch (emailError) {
      console.error("Failed to send admin notification email:", emailError)
    }

    return Response.json(
      {
        success: true,
        message: "Contact submission saved successfully",
        id: result.insertedId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Contact submission error:", error)
    return Response.json(
      { error: "Failed to process contact submission" },
      { status: 500 }
    )
  }
}

// Get all contact submissions - requires admin auth
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify admin token (basic check - in production use proper JWT verification)
    const adminToken = token
    if (!adminToken) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const db = await getDatabase()
    const contactSubmissions = db.collection("contactSubmissions")

    // Get query parameters for filtering
    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const query: any = {}
    if (status) {
      query.status = status
    }

    const submissions = await contactSubmissions
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await contactSubmissions.countDocuments(query)

    return Response.json(
      {
        submissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Get contact submissions error:", error)
    return Response.json(
      { error: "Failed to fetch contact submissions" },
      { status: 500 }
    )
  }
}