# Admin Panel - Credentials & Setup

## Default Admin Account

After running `npm run create-admin`, use these credentials:

- **Email**: admin@samarpan.com
- **Password**: admin@123

## Admin Login

1. Navigate to: `http://localhost:3000/admin/login`
2. Enter email and password
3. Click "Login"
4. You'll be redirected to the admin dashboard

## Admin Dashboard Features

### User Management
- **View All Users**: See list of all registered users
- **Search Users**: Filter users by name or email
- **User Details**: View user information including blood group, location, phone
- **Delete Users**: Remove user accounts from the system

### Notification System
- **Send Individual Notification**: Send message to specific user
- **Broadcast Notification**: Send message to all users
- **Notification History**: View sent notifications

### Admin Actions
- **Logout**: Safely logout from admin account

## Changing Admin Password

1. Login to admin panel
2. Go to admin settings (if available)
3. Change password
4. Save changes

**Note**: Currently, password change must be done directly in MongoDB or through a dedicated admin settings page (to be implemented).

## Creating Additional Admin Accounts

To create additional admin accounts, you need to:

1. Connect to MongoDB directly
2. Insert a new document in the `admins` collection:

\`\`\`javascript
db.admins.insertOne({
  email: "newadmin@samarpan.com",
  password: "hashed_password_here",
  name: "Admin Name",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
})
\`\`\`

Or use the admin panel (if admin management feature is implemented).

## API Endpoints for Admin

### Admin Login
\`\`\`
POST /api/auth/admin-login
Body: { email, password }
Response: { token, admin: { id, email, name, role } }
\`\`\`

### Get All Users
\`\`\`
GET /api/admin/users
Headers: { Authorization: Bearer <token> }
Response: { users: [...] }
\`\`\`

### Delete User
\`\`\`
DELETE /api/admin/users/:id
Headers: { Authorization: Bearer <token> }
Response: { message: "User deleted successfully" }
\`\`\`

### Send Notification
\`\`\`
POST /api/admin/send-notification
Headers: { Authorization: Bearer <token> }
Body: { userId, title, message } or { title, message } (for broadcast)
Response: { message: "Notification sent successfully" }
\`\`\`

## Security Best Practices

1. **Change Default Password**: Always change the default admin password
2. **Use Strong Passwords**: Admin passwords should be at least 12 characters
3. **Limit Admin Access**: Only give admin access to trusted personnel
4. **Monitor Admin Actions**: Keep logs of admin activities
5. **Regular Backups**: Backup MongoDB regularly
6. **Update Credentials**: Change admin credentials periodically

## Troubleshooting Admin Issues

### Admin Login Returns 400 Error
- Verify admin account exists in MongoDB
- Check email and password are correct
- Ensure MongoDB connection is working
- Check browser console for detailed error messages

### Cannot Access Admin Dashboard
- Verify you're logged in (check token in localStorage)
- Clear browser cache and try again
- Check browser console for errors

### Notifications Not Sending
- Verify user exists in database
- Check MongoDB connection
- Review server logs for errors

## Support

For admin-related issues, check the browser console and server logs for detailed error messages.
