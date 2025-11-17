import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { sendWhatsAppNotification } from "@/lib/whatsapp"

/**
 * QR Code Verification API - Production Ready
 * Admin verifies QR codes and marks donors as completed
 * 
 * Security Features:
 * - Admin token verification
 * - Input validation and sanitization
 * - Database-backed rate limiting
 * - Comprehensive error handling
 * - Audit logging
 */

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

async function checkRateLimit(identifier: string): Promise<boolean> {
  const db = await getDatabase();
  const rateLimitCollection = db.collection('rate_limits');
  const now = Date.now();

  // Atomically increment the count and get the new document.
  // Use upsert to handle the first request.
  const result = await rateLimitCollection.findOneAndUpdate(
    { identifier },
    { $inc: { count: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  const updatedDoc = result;

  if (!updatedDoc) {
    // This should not happen with upsert: true, but as a safeguard.
    console.error("[RATE-LIMIT] findOneAndUpdate with upsert returned null");
    return false;
  }

  // If the document was just created (count is 1), or if the window has expired, set/reset the time.
  if (updatedDoc.count === 1 || (updatedDoc.resetTime && now > updatedDoc.resetTime)) {
    await rateLimitCollection.updateOne(
      { identifier },
      { $set: { resetTime: now + RATE_LIMIT_WINDOW, count: 1 } } // Also reset count here
    );
    return true; // Allow this request.
  }
  
  // Now, check if the (already incremented) count exceeds the limit.
  if (updatedDoc.count > RATE_LIMIT_MAX_REQUESTS) {
    return false; // Denied.
  }

  return true; // Allowed.
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>"'&]/g, '');
}

function validateAlphanumericToken(token: string): boolean {
  return /^[A-Z0-9]{6}$/.test(token);
}

function validateObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// POST: Verify QR code and mark donation as completed
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    // Rate limiting by IP address
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    if (!await checkRateLimit(clientIp)) {
      console.warn(`[QR-VERIFY] Rate limit exceeded for IP: ${clientIp}`);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." }, 
        { status: 429 }
      );
    }

    // Authentication
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      console.warn(`[QR-VERIFY] Missing authentication token - Request ID: ${requestId}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAdminToken(token)
    if (!decoded || (decoded.role !== "admin" && decoded.role !== "superadmin")) {
      console.warn(`[QR-VERIFY] Invalid admin token - Request ID: ${requestId}`);
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Request body validation
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error(`[QR-VERIFY] Invalid JSON body - Request ID: ${requestId}`);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { alphanumericToken, registrationId } = body as {
      alphanumericToken?: string
      registrationId?: string
    }

    // Input validation
    if (!alphanumericToken && !registrationId) {
      return NextResponse.json(
        { error: "Alphanumeric token or registration ID is required" },
        { status: 400 }
      )
    }

    // Sanitize and validate inputs
    let sanitizedToken: string | undefined;
    let sanitizedRegistrationId: string | undefined;

    if (alphanumericToken) {
      sanitizedToken = sanitizeInput(alphanumericToken).toUpperCase();
      if (!validateAlphanumericToken(sanitizedToken)) {
        console.warn(`[QR-VERIFY] Invalid alphanumeric token format - Request ID: ${requestId}`);
        return NextResponse.json({ error: "Invalid alphanumeric token format" }, { status: 400 });
      }
    }

    if (registrationId) {
      sanitizedRegistrationId = sanitizeInput(registrationId);
      if (!validateObjectId(sanitizedRegistrationId)) {
        console.warn(`[QR-VERIFY] Invalid registration ID format - Request ID: ${requestId}`);
        return NextResponse.json({ error: "Invalid registration ID format" }, { status: 400 });
      }
    }

    const db = await getDatabase()
    const registrationsCollection = db.collection("event_registrations")
    const usersCollection = db.collection("users")

    console.log(`[QR-VERIFY] Admin ${decoded.email} attempting to verify registration - Request ID: ${requestId}`);

    // Find registration
    let registration
    try {
      if (sanitizedToken) {
        registration = await registrationsCollection.findOne({ alphanumericToken: sanitizedToken })
        console.log(`[QR-VERIFY] Searching by alphanumeric token: ${sanitizedToken} - Request ID: ${requestId}`);
      } else if (sanitizedRegistrationId) {
        registration = await registrationsCollection.findOne({
          _id: new ObjectId(sanitizedRegistrationId),
        })
        console.log(`[QR-VERIFY] Searching by registration ID: ${sanitizedRegistrationId} - Request ID: ${requestId}`);
      }
    } catch (dbError) {
      console.error(`[QR-VERIFY] Database error during registration lookup - Request ID: ${requestId}:`, dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!registration) {
      console.warn(`[QR-VERIFY] Registration not found - Request ID: ${requestId}`);
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    if (registration.tokenVerified) {
      console.warn(`[QR-VERIFY] Registration already verified - Request ID: ${requestId}`);
      return NextResponse.json(
        { error: "This registration has already been verified" },
        { status: 400 }
      )
    }

    // Update registration as verified
    let updateResult;
    try {
      updateResult = await registrationsCollection.updateOne(
        { _id: registration._id },
        {
          $set: {
            tokenVerified: true,
            donationStatus: "Completed",
            verifiedAt: new Date(),
            verifiedBy: decoded.adminId,
            updatedAt: new Date(),
          },
        }
      )
      
      if (updateResult.modifiedCount === 0) {
        console.error(`[QR-VERIFY] Failed to update registration - Request ID: ${requestId}`);
        return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
      }
      
      console.log(`[QR-VERIFY] Registration updated successfully - Request ID: ${requestId}`);
    } catch (updateError) {
      console.error(`[QR-VERIFY] Database error during registration update - Request ID: ${requestId}:`, updateError);
      return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
    }

    // Update user's donation record (fire and forget - don't fail the main operation)
    if (registration.userId) {
      try {
        const user = await usersCollection.findOne({
          _id: new ObjectId(registration.userId),
        })

        if (user) {
          // Increment total donations and update last donation date
          await usersCollection.updateOne(
            { _id: new ObjectId(registration.userId) },
            {
              $set: {
                lastDonationDate: new Date(),
                updatedAt: new Date(),
              },
              $inc: {
                totalDonations: 1,
              },
            }
          )
          console.log(`[QR-VERIFY] User donation record updated - Request ID: ${requestId}`);
        }
      } catch (userUpdateError) {
        console.error(`[QR-VERIFY] Error updating user donation record - Request ID: ${requestId}:`, userUpdateError)
        // Don't fail if user update fails
      }
    }

    // Create notification for user (fire and forget)
    try {
      const notificationsCollection = db.collection("notifications")
      const event = await db.collection("events").findOne({
        _id: new ObjectId(registration.eventId),
      })

      await notificationsCollection.insertOne({
        userId: new ObjectId(registration.userId),
        type: "event_donation_completed",
        title: "Event Participation Verified",
        message: `Your blood donation at ${event?.title || 'the event'} has been verified and recorded.`,
        eventId: registration.eventId,
        registrationId: registration._id,
        read: false,
        createdAt: new Date(),
      })
      console.log(`[QR-VERIFY] Notification created - Request ID: ${requestId}`);

      // Send WhatsApp to user (best-effort)
      try {
        const usersCollection = db.collection("users")
        const userDoc = await usersCollection.findOne({ _id: new ObjectId(registration.userId) })
        if (userDoc?.phone) {
          await sendWhatsAppNotification({
            phone: userDoc.phone,
            title: "Event Participation Verified",
            message: `Your blood donation at ${event?.title || 'the event'} has been verified and recorded.`,
          })
        }
      } catch (waErr) {
        console.error("[QR-VERIFY] WhatsApp send error:", waErr)
      }
    } catch (notificationError) {
      console.error(`[QR-VERIFY] Error creating notification - Request ID: ${requestId}:`, notificationError)
    }

    const responseTime = Date.now() - startTime;
    console.log(`[QR-VERIFY] QR verification completed successfully - Request ID: ${requestId} - Response time: ${responseTime}ms`);

    return NextResponse.json(
      {
        success: true,
        message: "QR code verified successfully",
        registration: {
          _id: registration._id,
          name: registration.name,
          registrationNumber: registration.registrationNumber,
          status: "Completed",
          verifiedAt: new Date(),
        },
        metadata: {
          requestId,
          verifiedBy: decoded.email,
          responseTime: `${responseTime}ms`
        }
      },
      { status: 200 }
    )
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[QR-VERIFY] QR verification failed - Request ID: ${requestId} - Response time: ${responseTime}ms:`, error)
    
    // Don't expose internal errors in production
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? "An error occurred during verification. Please try again."
      : (error instanceof Error ? error.message : "Internal server error");
      
    return NextResponse.json({ 
      success: false,
      error: errorMessage,
      metadata: {
        requestId,
        responseTime: `${responseTime}ms`
      }
    }, { status: 500 })
  }
}

// GET: Get registration by QR token (for verification)
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    // Rate limiting by IP address
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    if (!await checkRateLimit(clientIp)) {
      console.warn(`[QR-VERIFY-GET] Rate limit exceeded for IP: ${clientIp}`);
      return NextResponse.json(
        { 
          success: false,
          error: "Too many requests. Please try again later.",
          metadata: {
            requestId,
            responseTime: `${Date.now() - startTime}ms`
          }
        }, 
        { status: 429 }
      );
    }

    // Authentication
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      console.warn(`[QR-VERIFY-GET] Missing authentication token - Request ID: ${requestId}`);
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized",
        metadata: {
          requestId,
          responseTime: `${Date.now() - startTime}ms`
        }
      }, { status: 401 })
    }

    const decoded = verifyAdminToken(token)
    if (!decoded || (decoded.role !== "admin" && decoded.role !== "superadmin")) {
      console.warn(`[QR-VERIFY-GET] Invalid admin token - Request ID: ${requestId}`);
      return NextResponse.json({ 
        success: false,
        error: "Admin access required",
        metadata: {
          requestId,
          responseTime: `${Date.now() - startTime}ms`
        }
      }, { status: 403 })
    }

    const url = new URL(request.url)
    const alphanumericToken = url.searchParams.get("alphanumericToken")

    if (!alphanumericToken) {
      console.warn(`[QR-VERIFY-GET] Missing alphanumeric token - Request ID: ${requestId}`);
      return NextResponse.json({
        success: false,
        error: "Alphanumeric token is required",
        metadata: {
          requestId,
          responseTime: `${Date.now() - startTime}ms`
        }
      }, { status: 400 })
    }

    // Validate alphanumeric token format
    const sanitizedToken = sanitizeInput(alphanumericToken).toUpperCase();
    if (!validateAlphanumericToken(sanitizedToken)) {
      console.warn(`[QR-VERIFY-GET] Invalid alphanumeric token format - Request ID: ${requestId}`);
      return NextResponse.json({
        success: false,
        error: "Invalid alphanumeric token format",
        metadata: {
          requestId,
          responseTime: `${Date.now() - startTime}ms`
        }
      }, { status: 400 });
    }

    console.log(`[QR-VERIFY-GET] Admin ${decoded.email} retrieving registration - Request ID: ${requestId}`);

    const db = await getDatabase()
    const registrationsCollection = db.collection("event_registrations")

    let registration;
    try {
      registration = await registrationsCollection.findOne({ alphanumericToken: sanitizedToken })
      console.log(`[QR-VERIFY-GET] Registration lookup completed - Request ID: ${requestId}`);
    } catch (dbError) {
      console.error(`[QR-VERIFY-GET] Database error during registration lookup - Request ID: ${requestId}:`, dbError);
      return NextResponse.json({
        success: false,
        error: "Database error",
        metadata: {
          requestId,
          responseTime: `${Date.now() - startTime}ms`
        }
      }, { status: 500 });
    }

    if (!registration) {
      console.warn(`[QR-VERIFY-GET] Registration not found - Request ID: ${requestId}`);
      return NextResponse.json({ 
        success: false,
        error: "Registration not found",
        metadata: {
          requestId,
          responseTime: `${Date.now() - startTime}ms`
        }
      }, { status: 404 })
    }

    let event;
    try {
      event = await db.collection("events").findOne({
        _id: new ObjectId(registration.eventId),
      })
    } catch (dbError) {
      console.error(`[QR-VERIFY-GET] Database error during event lookup - Request ID: ${requestId}:`, dbError);
      // Continue without event data
    }

    // Fetch user details for phone
    let userPhone = registration.phone
    if (!userPhone && registration.userId) {
      try {
        const user = await db.collection("users").findOne({
          _id: new ObjectId(registration.userId),
        })
        userPhone = user?.phone
      } catch (dbError) {
        console.error(`[QR-VERIFY-GET] Database error during user lookup - Request ID: ${requestId}:`, dbError);
        // Continue without user phone
      }
    }

    const responseTime = Date.now() - startTime;
    console.log(`[QR-VERIFY-GET] Registration retrieved successfully - Request ID: ${requestId} - Response time: ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      registration: {
        _id: registration._id,
        name: registration.name,
        registrationNumber: registration.registrationNumber,
        email: registration.email,
        phone: userPhone,
        participantType: registration.participantType || "other",
        timeSlot: registration.timeSlot,
        tokenVerified: registration.tokenVerified,
        donationStatus: registration.donationStatus,
        createdAt: registration.createdAt,
        event: event ? { title: event.title, location: event.location, date: event.eventDate } : null,
      },
      metadata: {
        requestId,
        retrievedBy: decoded.email,
        responseTime: `${responseTime}ms`
      }
    })
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[QR-VERIFY-GET] Registration retrieval failed - Request ID: ${requestId} - Response time: ${responseTime}ms:`, error)
    
    // Don't expose internal errors in production
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? "An error occurred during retrieval. Please try again."
      : (error instanceof Error ? error.message : "Internal server error");
      
    return NextResponse.json({ 
      success: false,
      error: errorMessage,
      metadata: {
        requestId,
        responseTime: `${responseTime}ms`
      }
    }, { status: 500 })
  }
}