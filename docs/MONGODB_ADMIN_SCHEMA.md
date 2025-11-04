# MongoDB Admin Collection Schema

Complete reference for the `admins` collection structure in Samarpan.

---

## Collection: `admins`

### Purpose
Stores all admin account information including super admins and regular admins with role-based access control.

### Field Reference

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `_id` | ObjectId | Yes | Yes | Unique document identifier (auto-generated) |
| `email` | String | Yes | Yes | Admin login email address |
| `password` | String | Yes | No | Bcrypt hashed password |
| `name` | String | Yes | No | Admin display name |
| `role` | String | Yes | No | Either "superadmin" or "admin" |
| `permissions` | Array<String> | Yes | No | Array of permission strings (empty for superadmin) |
| `status` | String | Yes | No | Either "active" or "inactive" |
| `createdBy` | ObjectId | No | No | ID of admin who created this account |
| `createdAt` | Date | Yes | No | Account creation timestamp |
| `updatedAt` | Date | Yes | No | Last update timestamp |

### Indexes

```javascript
// Unique index on email
db.admins.createIndex({ email: 1 }, { unique: true })

// Index on role for filtering by role
db.admins.createIndex({ role: 1 })

// Index on createdAt for sorting
db.admins.createIndex({ createdAt: -1 })
```

---

## Example Documents

### Super Admin Account

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  email: "admin@samarpan.com",
  password: "$2a$10$N9qo8uLOickgx2ZMRZoHy.9sUsaLJzHNrHr0S0ydHRmL.4uBQOw2m",
  name: "Samarpan Admin",
  role: "superadmin",
  permissions: [],  // Empty for super admin
  status: "active",
  // No createdBy for initial super admin
  createdAt: ISODate("2024-01-15T10:30:00Z"),
  updatedAt: ISODate("2024-01-15T10:30:00Z")
}
```

### Regular Admin - Donation Manager

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  email: "donation@samarpan.com",
  password: "$2a$10$K9qo8uLOickgx2ZMRZoHy.9sUsaLJzHNrHr0S0ydHRmL.4uBQOw2m",
  name: "Donation Manager",
  role: "admin",
  permissions: [
    "manage_donations",
    "view_donations",
    "manage_blood_requests",
    "view_blood_requests"
  ],
  status: "active",
  createdBy: ObjectId("507f1f77bcf86cd799439011"),  // Created by super admin
  createdAt: ISODate("2024-01-15T11:00:00Z"),
  updatedAt: ISODate("2024-01-15T11:00:00Z")
}
```

### Regular Admin - Event Coordinator

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  email: "events@samarpan.com",
  password: "$2a$10$M9qo8uLOickgx2ZMRZoHy.9sUsaLJzHNrHr0S0ydHRmL.4uBQOw2m",
  name: "Event Coordinator",
  role: "admin",
  permissions: [
    "manage_events",
    "view_events",
    "view_event_donors",
    "generate_certificates",
    "send_notifications"
  ],
  status: "active",
  createdBy: ObjectId("507f1f77bcf86cd799439011"),
  createdAt: ISODate("2024-01-15T11:15:00Z"),
  updatedAt: ISODate("2024-01-15T11:15:00Z")
}
```

### Regular Admin - Support Staff (Inactive)

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439014"),
  email: "support@samarpan.com",
  password: "$2a$10$P9qo8uLOickgx2ZMRZoHy.9sUsaLJzHNrHr0S0ydHRmL.4uBQOw2m",
  name: "Support Staff",
  role: "admin",
  permissions: [
    "view_users",
    "view_contact_submissions",
    "send_notifications",
    "check_qr_codes"
  ],
  status: "inactive",  // Account is deactivated
  createdBy: ObjectId("507f1f77bcf86cd799439011"),
  createdAt: ISODate("2024-01-15T11:30:00Z"),
  updatedAt: ISODate("2024-01-20T09:00:00Z")  // Last updated when deactivated
}
```

---

## Permission Values Reference

### All Available Permissions

```javascript
[
  // User Management
  "manage_users",
  "view_users",

  // Donations
  "manage_donations",
  "view_donations",

  // Blood Requests
  "manage_blood_requests",
  "view_blood_requests",

  // Events
  "manage_events",
  "view_events",

  // Transportation
  "manage_transportation",
  "view_transportation",

  // Certificates
  "generate_certificates",

  // Notifications
  "send_notifications",

  // Images
  "view_donation_images",

  // Contact Submissions
  "view_contact_submissions",

  // QR Codes
  "check_qr_codes",

  // Event Donors
  "view_event_donors"
]
```

---

## Common MongoDB Queries

### Find Super Admin

```javascript
db.admins.findOne({ role: "superadmin" })
```

### Find All Active Admins

```javascript
db.admins.find({ status: "active" })
```

### Find Admin by Email

```javascript
db.admins.findOne({ email: "admin@samarpan.com" })
```

### Find All Admins with Specific Permission

```javascript
db.admins.find({ permissions: "manage_donations" })
```

### Count Admins by Role

```javascript
db.admins.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 } } }
])
```

### Find Admins Created by Specific User

```javascript
db.admins.find({ createdBy: ObjectId("507f1f77bcf86cd799439011") })
```

### Update Admin Status

```javascript
db.admins.updateOne(
  { email: "support@samarpan.com" },
  { $set: { status: "inactive", updatedAt: new Date() } }
)
```

### Add Permission to Admin

```javascript
db.admins.updateOne(
  { email: "donation@samarpan.com" },
  { 
    $push: { permissions: "view_donation_images" },
    $set: { updatedAt: new Date() }
  }
)
```

### Remove Permission from Admin

```javascript
db.admins.updateOne(
  { email: "donation@samarpan.com" },
  { 
    $pull: { permissions: "view_donation_images" },
    $set: { updatedAt: new Date() }
  }
)
```

### Delete Admin

```javascript
db.admins.deleteOne({ email: "support@samarpan.com" })
```

---

## Password Hashing Details

### Bcrypt Format

Passwords are hashed using bcryptjs with the following characteristics:

```
Algorithm: bcrypt
Cost Factor: 10 (salt rounds)
Format: $2a$10$...  or  $2b$10$...
Length: 60 characters
```

### Example Hash

```
Plain Password: admin@123
Bcrypt Hash: $2a$10$N9qo8uLOickgx2ZMRZoHy.9sUsaLJzHNrHr0S0ydHRmL.4uBQOw2m
```

### Validation

The password is verified using bcryptjs:

```typescript
import bcrypt from 'bcryptjs'

// Verify password
const isValid = await bcrypt.compare("admin@123", hashedPassword)
```

---

## Data Validation Rules

### Email
- **Format**: Valid email address (RFC 5322)
- **Unique**: Must be unique across all admins
- **Case**: Typically lowercase for consistency
- **Example**: `admin@samarpan.com`

### Password
- **Minimum**: 6 characters (recommended 8+)
- **Format**: Any characters (special chars allowed)
- **Storage**: Always hashed, never stored in plain text
- **Hashing**: Bcryptjs with 10 salt rounds

### Name
- **Format**: String
- **Minimum**: 1 character
- **Maximum**: 255 characters (recommended)
- **Example**: "Samarpan Admin"

### Role
- **Values**: `"superadmin"` or `"admin"`
- **Default**: `"admin"` for new accounts
- **Validation**: Must be one of the two values

### Permissions
- **Type**: Array of strings
- **Format**: Kebab-case (e.g., `manage_donations`)
- **Validation**: Must be from defined permission list
- **Super Admin**: Always empty array `[]`
- **Regular Admin**: Can have 0 or more permissions

### Status
- **Values**: `"active"` or `"inactive"`
- **Default**: `"active"` for new accounts
- **Inactive**: Admin cannot login
- **Reactivate**: Update status back to `"active"`

---

## Collection Maintenance

### Create Indexes

```bash
# Run this once to ensure indexes exist
npm run setup:admin
```

Or manually:

```javascript
// Unique index on email
db.admins.createIndex({ email: 1 }, { unique: true })

// Index for role queries
db.admins.createIndex({ role: 1 })

// Index for sorting by creation date
db.admins.createIndex({ createdAt: -1 })
```

### Backup Collection

```bash
# Export
mongoexport --collection=admins --db=samarpan --out=admins_backup.json

# Import
mongoimport --collection=admins --db=samarpan --file=admins_backup.json
```

### Reset Collection

```javascript
// Delete all admins (be careful!)
db.admins.deleteMany({})

// Then recreate super admin using:
// npm run setup:admin
```

---

## Performance Considerations

### Query Performance

| Query | Index | Performance |
|-------|-------|-------------|
| Find by email | `email: 1 (unique)` | ⚡ Excellent |
| Find by role | `role: 1` | ⚡ Excellent |
| Find by createdAt | `createdAt: -1` | ⚡ Excellent |
| Find by permissions | None | ⚠️ Full scan |

### Optimization Tips

1. Always use email for lookups (has unique index)
2. Use role for filtering admin types
3. Consider adding index for frequently queried fields
4. Avoid scanning permissions array for large collections

### Collection Size

```javascript
// Get collection stats
db.admins.stats()

// Estimate document size
db.admins.aggregate([{ $out: "admins_copy" }])
```

---

## Migration & Updates

### Add New Admin (Code Example)

```typescript
const newAdmin = {
  email: "new-admin@samarpan.com",
  password: await bcrypt.hash("tempPassword123", 10),
  name: "New Admin",
  role: "admin",
  permissions: ["manage_users", "view_donations"],
  status: "active",
  createdBy: superAdminId,
  createdAt: new Date(),
  updatedAt: new Date()
}

db.collection("admins").insertOne(newAdmin)
```

### Update Admin Permissions

```typescript
db.collection("admins").updateOne(
  { email: "admin@samarpan.com" },
  {
    $set: {
      permissions: ["manage_users", "manage_donations"],
      updatedAt: new Date()
    }
  }
)
```

### Deactivate Admin

```typescript
db.collection("admins").updateOne(
  { email: "admin@samarpan.com" },
  {
    $set: {
      status: "inactive",
      updatedAt: new Date()
    }
  }
)
```

---

## Troubleshooting

### Duplicate Key Error

```
E11000 duplicate key error collection: samarpan.admins index: email_1 dup key: { email: "admin@samarpan.com" }
```

**Solution**: Email already exists. Use different email or delete existing account.

### Document Validation Error

```
Failed to insert admin: Document failed validation
```

**Solution**: Ensure all required fields are present and valid.

### Index Not Found

```
E28517 cannot create index
```

**Solution**: Run index creation query again or drop and recreate index.

---

## References

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Bcryptjs Documentation](https://www.npmjs.com/package/bcryptjs)
- [Samarpan Admin System](./ADMIN_SYSTEM.md)
- [Admin Creation Guide](./ADMIN_CREATION_GUIDE.md)

---

**Schema Version**: 1.0  
**Last Updated**: 2024  
**Status**: Production Ready ✅