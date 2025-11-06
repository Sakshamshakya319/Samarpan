import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { verifyAdminPermission } from "@/lib/admin-utils-server"

export async function POST(request: NextRequest) {
  try {
    // Verify admin permission
    const verification = await verifyAdminPermission(request)
    
    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: verification.status || 401 })
    }

    const { donationId, userId, points, reason } = await request.json()

    if (!donationId || !userId || !points) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Find the user
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user's points
    const oldPoints = user.points || 0
    const newPoints = oldPoints + points
    
    // Add points history
    const pointsHistory = user.pointsHistory || []
    pointsHistory.push({
      type: "earned",
      points: points,
      reason: reason || "Blood donation reward",
      date: new Date(),
      referenceId: donationId,
    })

    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          points: newPoints,
          pointsHistory: pointsHistory
        } 
      }
    )

    // Update the donation record to mark points as awarded
    // Try to find and update in BloodRequest acceptances
    const bloodRequest = await db.collection("bloodrequests").findOne({ "acceptedBy._id": new ObjectId(donationId) })
    if (bloodRequest) {
      const acceptance = bloodRequest.acceptedBy.find(acc => acc._id.toString() === donationId)
      if (acceptance) {
        await db.collection("bloodrequests").updateOne(
          { "acceptedBy._id": new ObjectId(donationId) },
          { $set: { "acceptedBy.$.pointsAwarded": points } }
        )
      }
    }

    // Try to update in Donation model
    const donation = await db.collection("donations").findOne({ _id: new ObjectId(donationId) })
    if (donation) {
      await db.collection("donations").updateOne(
        { _id: new ObjectId(donationId) },
        { $set: { pointsAwarded: points } }
      )
    }

    // Try to update in Event donations
    const event = await db.collection("events").findOne({ "donors._id": new ObjectId(donationId) })
    if (event) {
      const donor = event.donors.find(d => d._id.toString() === donationId)
      if (donor) {
        await db.collection("events").updateOne(
          { "donors._id": new ObjectId(donationId) },
          { $set: { "donors.$.pointsAwarded": points } }
        )
      }
    }

    // Try to update in Event Registrations
    const eventRegistration = await db.collection("event_registrations").findOne({ _id: new ObjectId(donationId) })
    if (eventRegistration) {
      await db.collection("event_registrations").updateOne(
        { _id: new ObjectId(donationId) },
        { $inc: { pointsAwarded: points } }
      )
    }

    // Create notification for the user
    try {
      const notificationResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${request.headers.get("authorization")?.replace("Bearer ", "")}`,
        },
        body: JSON.stringify({
          userId: userId,
          title: "Points Awarded!",
          message: `You have been awarded ${points} points for your blood donation. Thank you for your contribution!`,
          type: "points",
        }),
      })

      if (!notificationResponse.ok) {
        console.warn("Failed to create notification for points award")
      }
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError)
    }

    return NextResponse.json({
      success: true,
      message: "Points awarded successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        points: newPoints,
        pointsAwarded: points,
      },
    })

  } catch (error) {
    console.error("Error awarding points:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}