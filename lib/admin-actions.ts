import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function logAdminAction(adminId: string, action: string, details: any) {
  try {
    const db = await getDatabase();
    const adminActionsCollection = db.collection("admin_actions");

    await adminActionsCollection.insertOne({
      adminId: new ObjectId(adminId),
      action,
      details,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error logging admin action:", error);
  }
}