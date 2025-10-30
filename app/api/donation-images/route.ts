import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const { imageData, latitude, longitude, locationName, acceptedRequestId } = await request.json()

    if (!imageData || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Image data and geolocation coordinates are required" },
        { status: 400 },
      )
    }

    // Validate geolocation coordinates
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json({ error: "Invalid geolocation coordinates" }, { status: 400 })
    }

    // Validate and extract image type from data URI or use default
    let cleanImageData = imageData
    let imageType = "image/jpeg" // default type
    
    if (imageData.includes(",")) {
      // Extract image type and data from data URI format
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/)
      if (matches) {
        imageType = matches[1]
        cleanImageData = matches[2]
      } else {
        cleanImageData = imageData.split(",")[1] || imageData
      }
    }

    // Validate that it's a valid base64 string
    if (!cleanImageData || cleanImageData.length === 0) {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 })
    }

    const donationImagesCollection = db.collection("donationImages")

    const result = await donationImagesCollection.insertOne({
      userId: new ObjectId(decoded.userId),
      imageData: cleanImageData,
      imageType,
      geolocation: {
        latitude,
        longitude,
        locationName: locationName || "",
      },
      acceptedRequestId: acceptedRequestId ? new ObjectId(acceptedRequestId) : null,
      status: "pending", // pending, approved, rejected
      uploadedAt: new Date(),
    })

    // Auto-create transportation request if acceptedRequestId is provided
    if (acceptedRequestId) {
      try {
        const acceptedBloodRequestsCollection = db.collection("acceptedBloodRequests")
        const bloodRequestsCollection = db.collection("bloodRequests")
        const usersCollection = db.collection("users")

        // Get the accepted request details
        const acceptedRequest = await acceptedBloodRequestsCollection.findOne({
          _id: new ObjectId(acceptedRequestId),
        })

        if (acceptedRequest) {
          // Get the blood request to fetch hospital location
          const bloodRequest = await bloodRequestsCollection.findOne({
            _id: acceptedRequest.bloodRequestId,
          })

          // Get user details for pickup location context
          const user = await usersCollection.findOne({
            _id: new ObjectId(decoded.userId),
          })

          if (bloodRequest) {
            // Create transportation request with geolocation as pickup location
            const transportationCollection = db.collection("transportationRequests")
            const pickupLocationName =
              locationName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`

            const transportationResult = await transportationCollection.insertOne({
              userId: new ObjectId(decoded.userId),
              acceptedRequestId: new ObjectId(acceptedRequestId),
              bloodRequestId: acceptedRequest.bloodRequestId,
              pickupLocation: pickupLocationName,
              pickupCoordinates: {
                latitude,
                longitude,
              },
              dropLocation: bloodRequest.hospitalLocation || "Hospital",
              hospitalName: bloodRequest.hospitalName || "",
              hospitalLocation: bloodRequest.hospitalLocation || "",
              status: "pending", // pending, assigned, completed, cancelled
              transportationVerified: true, // Set to true since location is auto-captured
              createdAt: new Date(),
              updatedAt: new Date(),
            })

            // Create notification for user
            const notificationsCollection = db.collection("notifications")
            await notificationsCollection.insertOne({
              userId: new ObjectId(decoded.userId),
              title: "Transportation Request Created",
              message: `Your pickup location has been automatically saved from your donation image upload.\n📍 Pickup: ${pickupLocationName}\n🏥 Drop: ${bloodRequest.hospitalLocation || "Hospital"}\n\nAdmin will assign a driver soon. You'll receive a notification with driver details.`,
              read: false,
              createdAt: new Date(),
            })
          }
        }
      } catch (transError) {
        console.error("Error creating transportation request:", transError)
        // Don't fail the image upload if transportation creation fails
      }
    }

    // Create notification for admin
    const notificationsCollection = db.collection("notifications")
    const adminsCollection = db.collection("admins")
    const admins = await adminsCollection.find({}).toArray()

    for (const admin of admins) {
      await notificationsCollection.insertOne({
        adminId: admin._id,
        userId: new ObjectId(decoded.userId),
        title: "New Donation Image Uploaded",
        message: `A donor has uploaded a geo-tagged donation image for verification.`,
        read: false,
        createdAt: new Date(),
      })
    }

    return NextResponse.json(
      {
        message: "Donation image uploaded successfully",
        imageId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Upload donation image error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const isAdmin = url.searchParams.get("admin") === "true"

    const db = await getDatabase()
    const donationImagesCollection = db.collection("donationImages")
    const usersCollection = db.collection("users")

    if (isAdmin) {
      // Admin can see all uploaded images with user email
      const images = await donationImagesCollection
        .find({})
        .sort({ uploadedAt: -1 })
        .toArray()

      // Fetch user emails for each image
      const imagesWithUserInfo = await Promise.all(
        images.map(async (image) => {
          const user = await usersCollection.findOne({ _id: image.userId })
          return {
            ...image,
            userEmail: user?.email || "Unknown",
          }
        })
      )

      return NextResponse.json({ images: imagesWithUserInfo })
    } else {
      // User can see only their own uploaded images
      const decoded = verifyToken(token)
      if (!decoded) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }

      const images = await donationImagesCollection
        .find({ userId: new ObjectId(decoded.userId) })
        .sort({ uploadedAt: -1 })
        .toArray()
      return NextResponse.json({ images })
    }
  } catch (error) {
    console.error("Get donation images error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}