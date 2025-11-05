import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken, verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Try to verify as admin first, then as user
    let decoded = verifyAdminToken(token)
    let isAdmin = decoded && decoded.role === "admin"
    
    if (!isAdmin) {
      decoded = verifyToken(token)
      if (!decoded) {
        return NextResponse.json({ error: "Invalid token or insufficient permissions" }, { status: 401 })
      }
    }

    const db = await getDatabase()
    const { acceptedRequestId, userId, pickupLocation, dropLocation, hospitalName, hospitalLocation, bloodRequestId } = await request.json()

    if (!pickupLocation || !dropLocation) {
      return NextResponse.json({ error: "Missing required fields: pickupLocation and dropLocation" }, { status: 400 })
    }

    // Determine userId based on who's making the request
    let requestUserId: string
    let requestCreatedBy: string | undefined
    
    if (isAdmin) {
      // Admin is arranging transportation
      if (!userId) {
        return NextResponse.json({ error: "Admin must provide userId" }, { status: 400 })
      }
      requestUserId = userId
      requestCreatedBy = decoded.adminId
    } else {
      // User is arranging their own transportation
      // User can provide acceptedRequestId (link to accepted donation) or bloodRequestId (link to blood request)
      if (!acceptedRequestId && !bloodRequestId) {
        return NextResponse.json({ error: "Missing acceptedRequestId or bloodRequestId" }, { status: 400 })
      }
      requestUserId = decoded.userId
      requestCreatedBy = undefined
    }

    const transportationCollection = db.collection("transportationRequests")

    const transportationDoc: any = {
      userId: new ObjectId(requestUserId),
      pickupLocation,
      dropLocation,
      hospitalName: hospitalName || "",
      hospitalLocation: hospitalLocation || dropLocation,
      status: "pending", // pending, assigned, completed, cancelled
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Add optional fields based on who's creating
    if (acceptedRequestId) {
      transportationDoc.acceptedRequestId = new ObjectId(acceptedRequestId)
    }
    if (bloodRequestId) {
      transportationDoc.bloodRequestId = new ObjectId(bloodRequestId)
    }
    if (requestCreatedBy) {
      transportationDoc.createdBy = new ObjectId(requestCreatedBy)
    }

    const result = await transportationCollection.insertOne(transportationDoc)

    // Create notification for user
    const notificationsCollection = db.collection("notifications")
    await notificationsCollection.insertOne({
      userId: new ObjectId(requestUserId),
      title: "Transportation Arranged",
      message: `Transportation has been arranged for your blood donation.\n📍 Pickup: ${pickupLocation}\n📍 Drop: ${dropLocation}${hospitalName ? `\n🏥 Hospital: ${hospitalName}` : ""}`,
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json(
      {
        message: "Transportation request created successfully",
        transportationId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create transportation request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    const transportationCollection = db.collection("transportationRequests")
    const usersCollection = db.collection("users")
    const bloodRequestsCollection = db.collection("bloodRequests")

    const requests = await transportationCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    // Enrich requests with user and blood request details
    const enrichedRequests = await Promise.allSettled(
      requests.map(async (req: any) => {
        try {
          const user = await usersCollection.findOne({ _id: req.userId })
          const bloodRequest = req.bloodRequestId
            ? await bloodRequestsCollection.findOne({ _id: req.bloodRequestId })
            : null

          return {
            ...req,
            userName: user?.name || "Unknown",
            userEmail: user?.email || "Unknown",
            userPhone: user?.phone || "",
            bloodGroup: bloodRequest?.bloodGroup || "N/A",
            quantity: bloodRequest?.quantity || 0,
            hospitalLocation: bloodRequest?.hospitalLocation || req.hospitalLocation || "",
          }
        } catch (err) {
          console.error(`Error enriching transportation request ${req._id}:`, err)
          return {
            ...req,
            userName: "Unknown",
            userEmail: "Unknown",
            userPhone: "",
            bloodGroup: "N/A",
            quantity: 0,
            hospitalLocation: req.hospitalLocation || "",
          }
        }
      })
    )

    // Extract fulfilled values and filter out rejected promises
    const successfulRequests = enrichedRequests
      .filter((result) => result.status === "fulfilled")
      .map((result) => (result as PromiseFulfilledResult<any>).value)

    return NextResponse.json({ requests: successfulRequests })
  } catch (error) {
    console.error("Get transportation requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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
    const { transportationId, driverNumber, driverName, status } = await request.json()

    if (!transportationId) {
      return NextResponse.json({ error: "Missing transportationId" }, { status: 400 })
    }

    const transportationCollection = db.collection("transportationRequests")
    const notificationsCollection = db.collection("notifications")

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (driverNumber) {
      updateData.driverNumber = driverNumber
    }

    if (driverName) {
      updateData.driverName = driverName
    }

    if (status) {
      updateData.status = status
    }

    const result = await transportationCollection.updateOne(
      { _id: new ObjectId(transportationId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Transportation request not found" }, { status: 404 })
    }

    // Get the updated transportation request
    const updatedTransport = await transportationCollection.findOne({
      _id: new ObjectId(transportationId),
    })

    // Create notification for user about status update
    if (status && updatedTransport) {
      const notificationMessages: { [key: string]: string } = {
        pending: "Your transportation request is pending assignment.",
        assigned: `Your transportation has been assigned. Driver contact: ${driverNumber || "TBD"}`,
        completed: "Your transportation has been completed. Thank you for your donation!",
        cancelled: "Your transportation request has been cancelled.",
      }

      const message = notificationMessages[status] || `Your transportation status updated to ${status}`

      await notificationsCollection.insertOne({
        userId: updatedTransport.userId,
        title: `Transportation Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message,
        read: false,
        createdAt: new Date(),
      })
    }

    return NextResponse.json(
      {
        message: "Transportation request updated successfully",
        transportation: updatedTransport,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Update transportation request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}