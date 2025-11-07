import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyAdminToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyAdminToken(token);
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ error: "Invalid token or insufficient permissions" }, { status: 401 });
    }

    const db = await getDatabase();
    const adminActionsCollection = db.collection("admin_actions");

    const actions = await adminActionsCollection
      .aggregate([
        {
          $lookup: {
            from: "admins",
            localField: "adminId",
            foreignField: "_id",
            as: "admin",
          },
        },
        {
          $unwind: "$admin",
        },
        {
          $project: {
            _id: 1,
            action: 1,
            details: 1,
            timestamp: 1,
            "admin.name": 1,
            "admin.email": 1,
          },
        },
        {
          $sort: { timestamp: -1 },
        },
      ])
      .toArray();

    return NextResponse.json({ actions });
  } catch (error) {
    console.error("Get admin action history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}