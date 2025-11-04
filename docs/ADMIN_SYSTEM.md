# Admin System Documentation

> 📌 **Quick Start**: See [Admin Creation Guide](./ADMIN_CREATION_GUIDE.md) for step-by-step setup and admin management instructions.

## Overview

The Samarpan Admin System is a role-based access control (RBAC) system that allows the super admin to create and manage other admin accounts with specific permissions. This document outlines the system architecture, user flows, and API endpoints.

### Quick Reference

**Super Admin Login**:
- Email: `admin@samarpan.com`
- Password: `admin@123` (change after first login)
- URL: `http://localhost:3000/admin/login`

**Setup Commands**:
```bash
npm run setup:admin      # Recommended: Setup admin system with indexes
npm run create-admin     # Interactive: Create super admin or regular admin
npx tsx create-admin.ts  # Direct: Create/update super admin
```

## Architecture

### Admin Roles

1. **Super Admin** (`superadmin`)
   - Has full access to all features
   - Can create, edit, and delete other admin accounts
   - Can assign permissions to other admins
   - Manages the entire admin system

2. **Admin** (`admin`)
   - Limited access based on assigned permissions
   - Can only access features they've been granted permission for
   - Cannot manage other admin accounts

### Permission System

The system uses a granular permission system. Available permissions include:

- **User Management**
  - `manage_users`: Full user management capabilities
  - `view_users`: View user data only

- **Donations**
  - `manage_donations`: Create, edit, delete donations
  - `view_donations`: View donations only

- **Blood Requests**
  - `manage_blood_requests`: Create, edit, delete blood requests
  - `view_blood_requests`: View blood requests only

- **Events**
  - `manage_events`: Create, edit, delete events
  - `view_events`: View events only

- **Transportation**
  - `manage_transportation`: Manage transportation requests
  - `view_transportation`: View transportation requests only

- **Certificates**
  - `generate_certificates`: Generate certificates for users

- **Notifications**
  - `send_notifications`: Send notifications to users

- **Donation Images**
  - `view_donation_images`: View donation images

- **Contact Submissions**
  - `view_contact_submissions`: View contact form submissions

- **QR Codes**
  - `check_qr_codes`: Check and validate QR codes

- **Event Donors**
  - `view_event_donors`: View event donor information

- **Admin Management**
  - `manage_admin_accounts`: Create and manage other admin accounts (Super Admin only)

## Routes

### Authentication

- **Super Admin Login**: `/admin/login`
  - For super admin accounts only
  - Redirects to `/admin/super-admin` dashboard

- **Admin Login**: `/admin/staff/login`
  - For regular admin accounts
  - Redirects to `/admin/dashboard`

### Dashboards

- **Super Admin Dashboard**: `/admin/super-admin`
  - Admin management interface
  - Access to all system features
  - View and manage other admin accounts

- **Admin Dashboard**: `/admin/dashboard`
  - Regular admin dashboard
  - Only shows features the admin has permission for
  - Limited access based on permissions

- **Admin (Legacy)**: `/admin`
  - Redirects to `/admin/super-admin` if super admin
  - Redirects to `/admin/dashboard` if regular admin
  - For backward compatibility

## API Endpoints

### Admin Account Management

All admin management endpoints require super admin authentication.

#### List Admin Accounts
```
GET /api/admin/accounts
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "message": "Admin accounts retrieved successfully",
  "accounts": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "admin@example.com",
      "name": "John Doe",
      "role": "admin",
      "permissions": ["manage_users", "view_donations"],
      "status": "active",
      "createdAt": "2024-01-15T10:30:00Z",
      "createdBy": "507f1f77bcf86cd799439010"
    }
  ],
  "total": 1
}
```

#### Create Admin Account
```
POST /api/admin/accounts
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "newadmin@example.com",
  "password": "secure_password_123",
  "name": "Jane Smith",
  "permissions": ["manage_users", "view_donations", "send_notifications"]
}
```

**Response:**
```json
{
  "message": "Admin account created successfully",
  "admin": {
    "id": "507f1f77bcf86cd799439012",
    "email": "newadmin@example.com",
    "name": "Jane Smith",
    "role": "admin",
    "permissions": ["manage_users", "view_donations", "send_notifications"],
    "status": "active"
  }
}
```

#### Get Admin Account Details
```
GET /api/admin/accounts/<admin_id>
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "message": "Admin account retrieved successfully",
  "admin": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "admin@example.com",
    "name": "John Doe",
    "role": "admin",
    "permissions": ["manage_users", "view_donations"],
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:45:00Z"
  }
}
```

#### Update Admin Account
```
PUT /api/admin/accounts/<admin_id>
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Jane Smith Updated",
  "email": "newemail@example.com",
  "permissions": ["manage_users", "view_donations", "generate_certificates"],
  "status": "active",
  "password": "new_password_456"  // Optional
}
```

**Response:**
```json
{
  "message": "Admin account updated successfully",
  "admin": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Jane Smith Updated",
    "email": "newemail@example.com",
    "permissions": ["manage_users", "view_donations", "generate_certificates"],
    "updatedAt": "2024-01-20T14:50:00Z"
  }
}
```

#### Delete Admin Account
```
DELETE /api/admin/accounts/<admin_id>
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "message": "Admin account deleted successfully"
}
```

### Permissions

#### Get Available Permissions
```
GET /api/admin/permissions
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "message": "Permissions retrieved successfully",
  "permissions": [
    {
      "id": "manage_users",
      "key": "MANAGE_USERS",
      "label": "Manage Users"
    },
    {
      "id": "view_users",
      "key": "VIEW_USERS",
      "label": "View Users"
    }
    // ... more permissions
  ],
  "groups": [
    {
      "id": "user_management",
      "name": "User Management",
      "permissions": ["manage_users", "view_users"]
    },
    // ... more groups
  ]
}
```

## Database Schema

### Admin Document

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  role: String, // "superadmin" or "admin"
  permissions: Array<String>, // Array of permission IDs
  status: String, // "active" or "inactive"
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId // Reference to admin who created this account
}
```

## Setting Up Super Admin

### Initial Setup

1. **Create the first super admin using create-admin script**
   ```bash
   npm run create-admin
   ```
   This script is already set up in the project's `scripts/create-admin.ts`

2. **Or manually via database**
   ```javascript
   db.admins.insertOne({
     email: "superadmin@example.com",
     password: "<hashed_password>",
     name: "Super Administrator",
     role: "superadmin",
     permissions: [], // Not needed for superadmin
     status: "active",
     createdAt: new Date(),
     updatedAt: new Date()
   })
   ```

## Client-Side Token Management

When an admin logs in, the following data is stored in localStorage:

```javascript
localStorage.setItem("adminToken", data.token)           // JWT token
localStorage.setItem("adminEmail", data.admin.email)     // Admin email
localStorage.setItem("adminRole", data.admin.role)       // "superadmin" or "admin"
localStorage.setItem("adminPermissions", JSON.stringify(data.admin.permissions))  // Permissions array
localStorage.setItem("adminName", data.admin.name)       // Admin name
```

## Frontend Permission Checking

### Using the Utility Functions

```typescript
import { hasPermission, hasAnyPermission, getAvailableFeatures } from "@/lib/admin-utils"
import { ADMIN_PERMISSIONS } from "@/lib/constants/admin-permissions"

// Check single permission
if (hasPermission(permissions, ADMIN_PERMISSIONS.MANAGE_USERS)) {
  // User can manage users
}

// Check if user has any of the permissions
if (hasAnyPermission(permissions, [
  ADMIN_PERMISSIONS.MANAGE_DONATIONS,
  ADMIN_PERMISSIONS.VIEW_DONATIONS
])) {
  // User has at least one of these permissions
}

// Get all available features
const features = getAvailableFeatures(permissions)
if (features.users) {
  // User can access user management
}
```

## Backend Permission Verification

### Using the Verification Middleware

```typescript
import { verifyAdminPermission } from "@/lib/admin-utils"
import { ADMIN_PERMISSIONS } from "@/lib/constants/admin-permissions"

export async function GET(request: NextRequest) {
  // Verify admin with specific permission
  const verification = await verifyAdminPermission(
    request,
    ADMIN_PERMISSIONS.MANAGE_USERS
  )

  if (!verification.valid) {
    return NextResponse.json(
      { error: verification.error },
      { status: verification.status || 401 }
    )
  }

  // verification.admin contains the admin document
  // verification.isSuperAdmin indicates if this is a superadmin
  
  // Proceed with the handler...
}
```

## Security Considerations

1. **Password Hashing**: All admin passwords are hashed using bcrypt before storage
2. **JWT Tokens**: Tokens include the admin role and are verified on each request
3. **Permission Checking**: Both frontend and backend verify permissions
4. **Superadmin Protection**: Superadmin accounts cannot be deleted or have their role changed
5. **Audit Trail**: System tracks which admin created/modified other admin accounts

## Workflow Examples

### Creating a New Admin Account

1. Super admin logs in at `/admin/login`
2. Navigates to Admin Management tab
3. Clicks "Create Admin" button
4. Fills in email, password, name, and selects permissions
5. Clicks "Create Admin"
6. New admin account is created with selected permissions
7. Admin can now log in at `/admin/staff/login` with given credentials

### Regular Admin Using Their Dashboard

1. Admin logs in at `/admin/staff/login`
2. Dashboard redirects to `/admin/dashboard`
3. Dashboard displays only tabs for permissions assigned
4. Admin can only access and modify data within their permissions
5. No admin management or user management tabs appear if not permitted

## Troubleshooting

### Admin Cannot Access Feature
- Check if admin has the required permission
- Verify permission is assigned correctly in admin management
- Clear browser localStorage and re-login

### Cannot Create Admin Account
- Verify logged-in user is super admin
- Check if email already exists in database
- Verify permissions array is valid

### Token Expired
- Admin needs to login again
- Tokens expire after 7 days
- Clear localStorage and re-authenticate

## Future Enhancements

- Role-based access control with custom roles
- Time-based permission restrictions
- Admin activity logging and audit trail
- Two-factor authentication for admins
- Permission inheritance and role templates