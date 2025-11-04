# Admin System Setup & Management Guide

## Overview

Samarpan has a two-tier admin system:
- **Super Admin**: Full access to all features (admin@samarpan.com)
- **Regular Admin**: Limited access based on selected features

## Initial Setup

### Option 1: Using Root Setup Script

```bash
npx tsx create-admin.ts
```

This script will:
- Create or verify the super admin account (admin@samarpan.com)
- Set the default password as `admin@123`
- Set up the account with full superadmin role

### Option 2: Using Admin System Setup Script

```bash
npm run setup:admin
```

This script will:
- Create database indexes for optimal performance
- Create or verify the super admin account
- Display admin system summary
- Show login information

### Option 3: Using Create-Admin Script

```bash
npm run create-admin
# or
npm run db:init
```

This runs an interactive script to create super admin or regular admin accounts.

## Super Admin Login

**URL**: `http://localhost:3000/admin/login`

**Credentials**:
- Email: `admin@samarpan.com`
- Password: `admin@123`

## Creating New Admins

### Via Web Interface (Recommended)

1. Login as super admin (admin@samarpan.com)
2. Navigate to **Admin Management** tab
3. Click **Create Admin** button
4. Fill in the form:
   - **Full Name**: Admin's full name
   - **Email**: Unique email address for login
   - **Password**: Temporary password (admin should change on first login)
   - **Select Features**: Choose permissions/features this admin can access

5. Click **Create Admin**

### Available Features/Permissions

#### User Management
- **Manage Users**: Full user management capabilities
- **View Users**: View-only access to user data

#### Donations
- **Manage Donations**: Full donation management
- **View Donations**: View-only access to donations

#### Blood Requests
- **Manage Blood Requests**: Full blood request management
- **View Blood Requests**: View-only access to requests

#### Events
- **Manage Events**: Full event management
- **View Events**: View-only access to events

#### Transportation
- **Manage Transportation**: Full transportation management
- **View Transportation**: View-only access to transportation

#### Certificates
- **Generate Certificates**: Ability to generate certificates

#### Notifications
- **Send Notifications**: Ability to send notifications to users

#### Images & Media
- **View Donation Images**: Access to donation images

#### Reports & Submissions
- **View Contact Submissions**: Access to contact form submissions

#### QR Codes
- **Check QR Codes**: Ability to scan and verify QR codes

#### Event Analytics
- **View Event Donors**: Access to event donor information

### Example Scenarios

#### Scenario 1: Donation Manager
Create an admin with the following features:
- Manage Donations
- View Donations
- Manage Blood Requests
- View Blood Requests

#### Scenario 2: Event Coordinator
Create an admin with the following features:
- Manage Events
- View Events
- View Event Donors
- Generate Certificates
- Send Notifications

#### Scenario 3: User Support Staff
Create an admin with the following features:
- View Users
- View Contact Submissions
- Send Notifications
- Check QR Codes

## Editing Admin Accounts

1. Login as super admin
2. Go to **Admin Management** tab
3. In the admins table, find the admin to edit
4. Click **Edit** button
5. Modify:
   - Full Name
   - Features/Permissions
   - Password (optional - leave empty to keep current)
6. Click **Update Admin**

## Deleting Admin Accounts

1. Login as super admin
2. Go to **Admin Management** tab
3. Find the admin to delete in the table
4. Click **Delete** button
5. Confirm the deletion

**Note**: Super admin accounts cannot be deleted via UI.

## Admin Account Fields in MongoDB

Admin accounts are stored in the `admins` collection with the following structure:

```javascript
{
  _id: ObjectId,
  email: "admin@example.com",           // Unique login email
  password: "hashed_password",          // Bcrypt hashed password
  name: "Admin Name",                   // Display name
  role: "superadmin" | "admin",         // Role type
  permissions: [                        // Array of permission strings
    "manage_users",
    "manage_donations",
    ...
  ],
  status: "active" | "inactive",        // Account status
  createdBy: ObjectId,                  // Created by admin ID (for regular admins)
  createdAt: Date,                      // Creation timestamp
  updatedAt: Date,                      // Last update timestamp
}
```

## Permission System Architecture

### How Permissions Work

1. **Super Admin**: Has `role: "superadmin"` - has implicit access to all features
2. **Regular Admin**: Has `role: "admin"` with specific permissions array

### Permissions List

```typescript
{
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
  generate_certificates: "Generate Certificates",
  send_notifications: "Send Notifications",
  view_donation_images: "View Donation Images",
  view_contact_submissions: "View Contact Submissions",
  check_qr_codes: "Check QR Codes",
  view_event_donors: "View Event Donors",
  manage_admin_accounts: "Manage Admin Accounts" (super admin only)
}
```

## API Endpoints

### Create Admin Account
```
POST /api/admin/accounts
Headers: Authorization: Bearer <token>
Body: {
  email: "new-admin@example.com",
  password: "temporary-password",
  name: "Admin Name",
  permissions: ["manage_users", "view_donations"]
}
```

### Get All Admin Accounts
```
GET /api/admin/accounts
Headers: Authorization: Bearer <token>
```

### Get Specific Admin Account
```
GET /api/admin/accounts/[id]
Headers: Authorization: Bearer <token>
```

### Update Admin Account
```
PUT /api/admin/accounts/[id]
Headers: Authorization: Bearer <token>
Body: {
  name: "Updated Name",
  permissions: ["manage_users"],
  password: "new-password" (optional),
  status: "active" | "inactive"
}
```

### Delete Admin Account
```
DELETE /api/admin/accounts/[id]
Headers: Authorization: Bearer <token>
```

### Get Available Permissions
```
GET /api/admin/permissions
Headers: Authorization: Bearer <token>
```

## Security Best Practices

1. **Change Default Password**: After initial setup, change the admin@123 password
2. **Strong Passwords**: Enforce strong password policies when creating admin accounts
3. **Least Privilege**: Only assign necessary permissions to each admin
4. **Regular Audits**: Periodically review admin accounts and their permissions
5. **Account Deactivation**: Instead of deleting, consider deactivating unused accounts
6. **Audit Logging**: Track admin actions for security and compliance

## Troubleshooting

### Super Admin Not Found
- Run `npm run setup:admin` to ensure super admin is created
- Check MongoDB connection

### Cannot Login as Super Admin
- Verify credentials: admin@samarpan.com / admin@123
- Check if account status is "active"
- Check MongoDB admins collection

### Permission Denied Errors
- Verify user has appropriate permissions
- Check admin role is set correctly
- Review permission array in admin document

### Admin Management Tab Not Visible
- Ensure logged in as super admin (role: "superadmin")
- Check localStorage for adminRole

## Database Initialization

### Create Required Indexes

The system automatically creates indexes for:
- `email` (unique index)
- `role` (single index)
- `createdAt` (descending index)

### Reset Admin System

To reset and recreate the super admin:

```bash
# Delete the super admin account from MongoDB
db.admins.deleteOne({ email: "admin@samarpan.com" })

# Recreate super admin
npm run setup:admin
```

## Advanced Configuration

### Customize Super Admin Credentials

To use different default credentials, edit `create-admin.ts`:

```typescript
// Change these values:
const hashedPassword = await bcrypt.hash("YOUR_PASSWORD", salt)
const result = await adminsCollection.insertOne({
  email: "YOUR_EMAIL@samarpan.com",
  password: hashedPassword,
  name: "YOUR_NAME",
  ...
})
```

Then run:
```bash
npx tsx create-admin.ts
```

## Related Documentation

- [Admin System Architecture](./ADMIN_SYSTEM.md)
- [Authentication Guide](./AUTHENTICATION.md)
- [API Documentation](./API.md)