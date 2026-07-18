import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Aggregate rare donors grouped by city and blood group
    const pipeline = [
      {
        $match: {
          is_rare_donor: true,
          rare_groups: { $exists: true, $not: { $size: 0 } }
        }
      },
      {
        $unwind: "$rare_groups"
      },
      {
        $group: {
          _id: { city: "$city", blood_group: "$rare_groups" },
          donor_count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          city: "$_id.city",
          blood_group: "$_id.blood_group",
          donor_count: 1
        }
      },
      {
        $sort: { city: 1, blood_group: 1 }
      }
    ]

    const stats = await usersCollection.aggregate(pipeline).toArray()

    return NextResponse.json({ stats }, { status: 200 })
  } catch (error) {
    console.error("[Rare Registry Stats GET] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
