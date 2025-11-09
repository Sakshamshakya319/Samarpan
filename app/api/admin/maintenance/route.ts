import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminPermission } from "@/lib/admin-utils";
import { getMaintenanceSettings, updateMaintenanceSettings } from "@/lib/maintenance-cache";

const INTERNAL_TOKEN = process.env.MAINTENANCE_INTERNAL_TOKEN ?? "INTERNAL_MAINTENANCE_CHECK_TOKEN";

export async function GET(request: NextRequest) {
  try {
    const maintenanceSettings = getMaintenanceSettings();
    const publicSettings = {
      enabled: maintenanceSettings.enabled,
      message: maintenanceSettings.message,
      enabledAt: maintenanceSettings.enabledAt
    };

    if (request.headers.get("x-maintenance-internal") === INTERNAL_TOKEN) {
      return NextResponse.json(maintenanceSettings);
    }

    const verification = await verifyAdminPermission(request);

    if (!verification.valid) {
      return NextResponse.json(publicSettings);
    }

    if (verification.admin.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(maintenanceSettings);
  } catch (error) {
    console.error("Maintenance status error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const verification = await verifyAdminPermission(request);
  if (!verification.valid) {
    return NextResponse.json({ error: verification.error }, { status: verification.status || 401 });
  }
  if (verification.admin.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { enabled, message, allowedIps, secretKey } = body;

    console.log('Received maintenance update request:', body);

    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid payload: 'enabled' must be a boolean" }, { status: 400 });
    }

    if (message && typeof message !== "string") {
      return NextResponse.json({ error: "Invalid payload: 'message' must be a string" }, { status: 400 });
    }

    if (allowedIps && !Array.isArray(allowedIps)) {
      return NextResponse.json({ error: "Invalid payload: 'allowedIps' must be an array" }, { status: 400 });
    }

    if (secretKey !== null && secretKey !== undefined && typeof secretKey !== "string") {
      return NextResponse.json({ error: "Invalid payload: 'secretKey' must be a string or null" }, { status: 400 });
    }

    const updatedSettings = updateMaintenanceSettings({
      enabled,
      message: message?.trim() || "The website is currently under maintenance. We will be back shortly.",
      allowedIps: allowedIps || [],
      secretKey: secretKey?.trim() || null
    });

    console.log('Updated maintenance settings:', updatedSettings);

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Maintenance update error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
