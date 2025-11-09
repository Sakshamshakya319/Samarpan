import { NextResponse } from "next/server";
import { getMaintenanceSettings, updateMaintenanceSettings } from "@/lib/maintenance-cache";

export async function GET() {
  try {
    const maintenanceSettings = getMaintenanceSettings();
    return NextResponse.json(maintenanceSettings);
  } catch (error) {
    console.error("Error fetching maintenance settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { enabled, message, allowedIps, secretKey } = body;

    const updatedSettings = updateMaintenanceSettings({
      enabled: Boolean(enabled),
      message: message || "",
      allowedIps: Array.isArray(allowedIps) ? allowedIps : [],
      secretKey: secretKey || ""
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error updating maintenance settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}