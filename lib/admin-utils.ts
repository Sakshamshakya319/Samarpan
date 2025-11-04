import { ADMIN_PERMISSIONS } from "@/lib/constants/admin-permissions"

// Re-export server-only utilities (for API routes only)
export { verifyAdminPermission } from "@/lib/admin-utils-server"
export type { AdminTokenPayload } from "@/lib/admin-utils-server"

/**
 * Check if admin has permission (client-side utility)
 */
export function hasPermission(
  permissions: string[] | undefined,
  requiredPermission: string,
): boolean {
  if (!permissions) return false
  return permissions.includes(requiredPermission)
}

/**
 * Check if admin has any of the permissions (client-side utility)
 */
export function hasAnyPermission(
  permissions: string[] | undefined,
  requiredPermissions: string[],
): boolean {
  if (!permissions) return false
  return requiredPermissions.some((perm) => permissions.includes(perm))
}

/**
 * Get admin features based on permissions (client-safe utility)
 */
export function getAvailableFeatures(permissions: string[] | undefined) {
  if (!permissions) return []

  const features = {
    users: permissions.includes(ADMIN_PERMISSIONS.MANAGE_USERS) ||
      permissions.includes(ADMIN_PERMISSIONS.VIEW_USERS),
    notifications: permissions.includes(ADMIN_PERMISSIONS.SEND_NOTIFICATIONS),
    certificates: permissions.includes(
      ADMIN_PERMISSIONS.GENERATE_CERTIFICATES,
    ),
    donations: permissions.includes(ADMIN_PERMISSIONS.MANAGE_DONATIONS) ||
      permissions.includes(ADMIN_PERMISSIONS.VIEW_DONATIONS),
    images: permissions.includes(ADMIN_PERMISSIONS.VIEW_DONATION_IMAGES),
    bloodRequests: permissions.includes(
      ADMIN_PERMISSIONS.MANAGE_BLOOD_REQUESTS,
    ) ||
      permissions.includes(ADMIN_PERMISSIONS.VIEW_BLOOD_REQUESTS),
    events: permissions.includes(ADMIN_PERMISSIONS.MANAGE_EVENTS) ||
      permissions.includes(ADMIN_PERMISSIONS.VIEW_EVENTS),
    transportation: permissions.includes(
      ADMIN_PERMISSIONS.MANAGE_TRANSPORTATION,
    ) ||
      permissions.includes(ADMIN_PERMISSIONS.VIEW_TRANSPORTATION),
    contacts: permissions.includes(ADMIN_PERMISSIONS.VIEW_CONTACT_SUBMISSIONS),
    qrChecker: permissions.includes(ADMIN_PERMISSIONS.CHECK_QR_CODES),
    eventDonors: permissions.includes(ADMIN_PERMISSIONS.VIEW_EVENT_DONORS),
    blogs: permissions.includes(ADMIN_PERMISSIONS.MANAGE_BLOGS) ||
      permissions.includes(ADMIN_PERMISSIONS.VIEW_BLOGS),
    adminAccounts: permissions.includes(ADMIN_PERMISSIONS.MANAGE_ADMIN_ACCOUNTS),
  }

  return features
}