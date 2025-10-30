# Admin Panel Setup & Documentation

## Overview

The Samarpan admin panel allows administrators to manage users, send notifications, and oversee the platform operations.

## Admin Credentials

### Default Admin Account

After running the setup script, use these credentials to login:

- **Email**: `admin@samarpan.com`
- **Password**: `admin@123`

**IMPORTANT**: Change this password immediately after your first login!

## Admin Login

1. Navigate to the admin login page: `/admin/login`
2. Enter your email and password
3. Click "Login"
4. You will be redirected to the admin dashboard

## Admin Features

### 1. User Management
- View all registered users
- Search and filter users by email or name
- View user details (blood group, location, phone, etc.)
- Delete user accounts if necessary

### 2. Send Notifications
- Send notifications to individual users
- Broadcast notifications to all users
- Track notification history

### 3. Dashboard
- View platform statistics
- Monitor user activity
- Access quick actions

## Admin API Endpoints

### Authentication
- **POST** `/api/auth/admin-login`
  - Body: `{ email: string, password: string }`
  - Returns: JWT token and admin info

### User Management
- **GET** `/api/admin/users`
  - Headers: `Authorization: Bearer {token}`
  - Returns: List of all users

- **DELETE** `/api/admin/users/{userId}`
  - Headers: `Authorization: Bearer {token}`
  - Deletes a user account

### Notifications
- **POST** `/api/admin/send-notification`
  - Headers: `Authorization: Bearer {token}`
  - Body: `{ userId?: string, title: string, message: string }`
  - If userId is omitted, notification is sent to all users

## Database Models

### Admin Model
\`\`\`javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  role: String ("admin"),
  createdAt: Date
}
\`\`\`

### User Model
\`\`\`javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  bloodGroup: String,
  location: String,
  phone: String,
  lastDonationDate: Date,
  role: String ("user"),
  createdAt: Date
}
\`\`\`

### Notification Model
\`\`\`javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  message: String,
  read: Boolean,
  createdAt: Date
}
\`\`\`

## Creating Additional Admin Accounts

To create additional admin accounts, you can:

1. Use MongoDB directly to insert a new admin document
2. Modify the `scripts/create-admin.ts` file to create multiple admins
3. Create an admin registration endpoint (recommended for production)

Example MongoDB insert:
\`\`\`javascript
db.admins.insertOne({
  email: "newadmin@samarpan.com",
  password: bcrypt.hashSync("password123", 10),
  name: "New Admin",
  role: "admin",
  createdAt: new Date()
})
\`\`\`

## Security Best Practices

1. **Change Default Password**: Always change the default admin password immediately
2. **Use Strong Passwords**: Ensure all admin passwords are strong and unique
3. **Limit Admin Access**: Only grant admin access to trusted individuals
4. **Monitor Activity**: Regularly review admin actions and user management
5. **Secure Tokens**: Keep JWT tokens secure and never share them
6. **Regular Backups**: Maintain regular backups of your MongoDB database
7. **Update Credentials**: Periodically update admin credentials

## Troubleshooting

### Admin Login Not Working
- Verify the email and password are correct
- Check that the admin account exists in the database
- Ensure MongoDB connection is working

### Cannot Access Admin Dashboard
- Verify you have a valid JWT token
- Check that the token hasn't expired
- Ensure your admin account has the "admin" role

### Notifications Not Sending
- Verify the user ID is correct
- Check MongoDB connection
- Ensure the notification collection exists

## Support

For additional support or issues, please contact:
- Email: support@samarpan.com
- Phone: +91 98765 43210
