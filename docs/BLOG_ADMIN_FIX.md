# Blog Admin Permission Fix

## Issue Description

Sub-admins (regular admins) were unable to create blog posts, receiving a `401 Unauthorized - Admin not found` error when attempting to post a blog.

## Root Cause Analysis

The issue had two components:

### 1. Missing Blog Permissions in Create-Admin Script
The `scripts/create-admin.ts` file was missing the blog management permissions from its permission selection menu. When creating a regular admin, there was no option to grant `manage_blogs` or `view_blogs` permissions.

**Affected Permissions:**
- `manage_blogs` - Permission to create, edit, and publish blogs
- `view_blogs` - Permission to view blogs only

The script was displaying only 16 permissions when there are actually 18 permissions available in the system.

### 2. Existing Admins Without Blog Permissions
Any regular admin accounts created before this fix would not have the blog management permissions in their permissions array, preventing them from accessing blog features.

## Solution Implemented

### 1. Updated Create-Admin Script
**File:** `scripts/create-admin.ts`

Added blog permissions to the permission selection menu:
```
17. manage_blogs - Manage blogs
18. view_blogs - View blogs only
```

These permissions are now available when creating new regular admin accounts.

### 2. Created Permission Migration Script
**File:** `scripts/add-blog-permissions.ts`

A new interactive script that allows updating existing admin accounts with blog management permissions. This script provides three options:

1. **Add manage_blogs to all regular admins**
   - Adds the `manage_blogs` permission to every non-superadmin account

2. **Add manage_blogs to a specific admin**
   - Updates permissions for a single admin account by email

3. **Add specific permissions to an admin**
   - Allows selecting multiple permissions to add to a specific admin account

### 3. Improved Error Logging
**File:** `lib/admin-utils-server.ts`

Enhanced error logging in the admin verification function:
- Added console logging when admin ID conversion fails
- Added console logging when admin record is not found in database
- This helps with debugging similar issues in the future

### 4. Added NPM Script
**File:** `package.json`

Added new npm script for easy access to the permission migration:
```bash
npm run add-blog-perms
```

## How to Fix Existing Admin Accounts

### Option 1: Add Blog Permissions to All Existing Admins

Run the migration script and select option 1:

```bash
npm run add-blog-perms
```

Then select `1` when prompted to add `manage_blogs` to all regular admins.

### Option 2: Add Blog Permissions to Specific Admin

Run the migration script and select option 2 or 3:

```bash
npm run add-blog-perms
```

Then select `2` or `3` and follow the prompts.

### Option 3: Create New Admin with Blog Permissions

When creating a new admin account:

```bash
npm run create-admin
```

When prompted for permissions, include `17` (manage_blogs) or `18` (view_blogs) in the comma-separated list.

## API Endpoints

### Blog Creation
- **Endpoint:** `POST /api/blogs`
- **Required Permission:** `manage_blogs`
- **Status on Failure:**
  - `401` - No admin token provided
  - `401` - Invalid or expired token
  - `401` - Admin not found (check database connection)
  - `403` - Admin lacks `manage_blogs` permission
  - `400` - Missing required fields (title, content, images)

### Blog Update
- **Endpoint:** `PUT /api/blogs/[id]`
- **Required Permission:** `manage_blogs`
- **Additional Check:** Only the blog author or superadmin can edit

### Blog Delete
- **Endpoint:** `DELETE /api/blogs/[id]`
- **Required Permission:** `manage_blogs`
- **Additional Check:** Only the blog author or superadmin can delete

## File Changes Summary

| File | Change |
|------|--------|
| `scripts/create-admin.ts` | Added permissions 17-18 for blog management |
| `scripts/add-blog-permissions.ts` | NEW: Permission migration script |
| `lib/admin-utils-server.ts` | Enhanced error logging for debugging |
| `package.json` | Added `add-blog-perms` npm script |

## Verification Steps

After applying the fix:

1. **Verify New Admin Creation:**
   ```bash
   npm run create-admin
   # Select to create regular admin
   # When asked for permissions, enter: 17
   # Test blog creation with new account
   ```

2. **Update Existing Admins:**
   ```bash
   npm run add-blog-perms
   # Select option 1 to add manage_blogs to all regular admins
   # Or option 2/3 to add to specific admins
   ```

3. **Test Blog Creation:**
   - Log in as admin with `manage_blogs` permission
   - Navigate to blog management section
   - Attempt to create a new blog post
   - Should succeed without authorization errors

## Additional Notes

### Permission System Architecture
- **Superadmin:** Has all permissions automatically (no need to grant explicitly)
- **Regular Admin:** Permissions must be explicitly granted during creation or updated later
- **Permission Format:** Stored as array of strings in MongoDB admin document

### Database Schema
Admin document structure:
```javascript
{
  _id: ObjectId,
  email: string (unique),
  password: string (hashed),
  name: string,
  role: "superadmin" | "admin",
  permissions: string[], // Array of permission IDs
  status: "active" | "inactive",
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId // Who created this account
}
```

### Complete Permission List
1. manage_users
2. view_users
3. manage_donations
4. view_donations
5. manage_blood_requests
6. view_blood_requests
7. manage_events
8. view_events
9. manage_transportation
10. view_transportation
11. generate_certificates
12. send_notifications
13. view_donation_images
14. view_contact_submissions
15. check_qr_codes
16. view_event_donors
17. **manage_blogs** (NEW)
18. **view_blogs** (NEW)
19. manage_admin_accounts (superadmin only)

## Troubleshooting

### Still Getting "Admin not found" Error
1. Check admin's authentication token is valid
2. Verify admin record exists in MongoDB `admins` collection
3. Check database connection
4. Review server logs for detailed error messages

### "Permission denied" Error
1. Verify admin has `manage_blogs` permission
2. Use `npm run add-blog-perms` to add permission
3. Check admin account status is "active"

### Migration Script Issues
1. Ensure MongoDB connection is configured in `.env.local`
2. Check script output for specific error messages
3. Verify admin email is correct when updating individual admins