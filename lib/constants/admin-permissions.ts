// Define all available admin permissions/features
export const ADMIN_PERMISSIONS = {
  // User management
  MANAGE_USERS: "manage_users",
  VIEW_USERS: "view_users",

  // Donations
  MANAGE_DONATIONS: "manage_donations",
  VIEW_DONATIONS: "view_donations",

  // Blood requests
  MANAGE_BLOOD_REQUESTS: "manage_blood_requests",
  VIEW_BLOOD_REQUESTS: "view_blood_requests",

  // Events
  MANAGE_EVENTS: "manage_events",
  VIEW_EVENTS: "view_events",

  // Transportation
  MANAGE_TRANSPORTATION: "manage_transportation",
  VIEW_TRANSPORTATION: "view_transportation",

  // Certificates
  GENERATE_CERTIFICATES: "generate_certificates",

  // Notifications
  SEND_NOTIFICATIONS: "send_notifications",

  // Donation images
  VIEW_DONATION_IMAGES: "view_donation_images",

  // Contact submissions
  VIEW_CONTACT_SUBMISSIONS: "view_contact_submissions",

  // QR code checker
  CHECK_QR_CODES: "check_qr_codes",

  // Event donors
  VIEW_EVENT_DONORS: "view_event_donors",

  // Blog management
  MANAGE_BLOGS: "manage_blogs",
  VIEW_BLOGS: "view_blogs",

  // Admin management (super admin only)
  MANAGE_ADMIN_ACCOUNTS: "manage_admin_accounts",
} as const

export const PERMISSION_GROUPS = {
  user_management: [
    ADMIN_PERMISSIONS.MANAGE_USERS,
    ADMIN_PERMISSIONS.VIEW_USERS,
  ],
  donations: [
    ADMIN_PERMISSIONS.MANAGE_DONATIONS,
    ADMIN_PERMISSIONS.VIEW_DONATIONS,
  ],
  blood_requests: [
    ADMIN_PERMISSIONS.MANAGE_BLOOD_REQUESTS,
    ADMIN_PERMISSIONS.VIEW_BLOOD_REQUESTS,
  ],
  events: [ADMIN_PERMISSIONS.MANAGE_EVENTS, ADMIN_PERMISSIONS.VIEW_EVENTS],
  transportation: [
    ADMIN_PERMISSIONS.MANAGE_TRANSPORTATION,
    ADMIN_PERMISSIONS.VIEW_TRANSPORTATION,
  ],
  blogs: [ADMIN_PERMISSIONS.MANAGE_BLOGS, ADMIN_PERMISSIONS.VIEW_BLOGS],
  certificates: [ADMIN_PERMISSIONS.GENERATE_CERTIFICATES],
  notifications: [ADMIN_PERMISSIONS.SEND_NOTIFICATIONS],
  images: [ADMIN_PERMISSIONS.VIEW_DONATION_IMAGES],
  contacts: [ADMIN_PERMISSIONS.VIEW_CONTACT_SUBMISSIONS],
  qr: [ADMIN_PERMISSIONS.CHECK_QR_CODES],
  event_donors: [ADMIN_PERMISSIONS.VIEW_EVENT_DONORS],
  admin_management: [ADMIN_PERMISSIONS.MANAGE_ADMIN_ACCOUNTS],
} as const

export const PERMISSION_LABELS: Record<string, string> = {
  manage_users: "Manage Users",
  view_users: "View Users",
  manage_donations: "Manage Donations",
  view_donations: "View Donations",
  manage_blood_requests: "Manage Blood Requests",
  view_blood_requests: "View Blood Requests",
  manage_events: "Manage Events",
  view_events: "View Events",
  manage_transportation: "Manage Transportation",
  view_transportation: "View Transportation",
  manage_blogs: "Manage Blogs",
  view_blogs: "View Blogs",
  generate_certificates: "Generate Certificates",
  send_notifications: "Send Notifications",
  view_donation_images: "View Donation Images",
  view_contact_submissions: "View Contact Submissions",
  check_qr_codes: "Check QR Codes",
  view_event_donors: "View Event Donors",
  manage_admin_accounts: "Manage Admin Accounts",
}