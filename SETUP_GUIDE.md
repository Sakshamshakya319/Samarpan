# Samarpan Blood Donor Platform - Complete Setup Guide

## Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (free tier available)
- Vercel account (for deployment)

## Step 1: Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

\`\`\`env
# MongoDB Connection - REQUIRED
MONGODB_URL=mongodb+srv://samarpan:lbBAnhIT4lrkpZes@samarpan.pftbejf.mongodb.net/?appName=Samarpan

# JWT Secret (change this in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345

# Next.js Environment
NEXT_PUBLIC_API_URL=http://localhost:3000
\`\`\`

**Important**: The `MONGODB_URL` is the most critical variable. Without it, signup and login will fail with a 400 error.

## Step 2: Install Dependencies

\`\`\`bash
npm install
\`\`\`

## Step 3: Create Admin User

Run the admin creation script:

\`\`\`bash
npm run create-admin
\`\`\`

This will create an admin account with:
- **Email**: admin@samarpan.com
- **Password**: admin@123

**Important**: Change the admin password immediately after first login!

## Step 4: Run Development Server

\`\`\`bash
npm run dev
\`\`\`

The app will be available at `http://localhost:3000`

## Step 5: Test the Application

### User Registration & Login
1. Go to `http://localhost:3000/signup`
2. Create a new account with:
   - Full Name: Your Name
   - Email: your@email.com
   - Password: password123 (minimum 6 characters)
3. You'll be automatically redirected to `/dashboard`
4. Check browser console (F12) for detailed logs

### Admin Login
1. Go to `http://localhost:3000/admin/login`
2. Login with:
   - Email: admin@samarpan.com
   - Password: admin@123
3. Access admin dashboard at `/admin`

## Application Routes

### Public Routes
- `/` - Homepage
- `/about` - About Samarpan
- `/events` - Upcoming Events
- `/contact` - Contact Us
- `/login` - User Login
- `/signup` - User Registration

### Protected User Routes
- `/dashboard` - User Dashboard
- `/profile` - User Profile Management

### Admin Routes
- `/admin/login` - Admin Login
- `/admin` - Admin Dashboard (manage users, send notifications)

## Features

### User Features
- User registration and authentication
- Profile management (blood group, location, phone, donation history)
- Real-time notifications from admin
- Dashboard with personal information

### Admin Features
- View all registered users
- Search and filter users
- Send notifications to individual users or broadcast to all
- Delete user accounts
- User management dashboard

## Troubleshooting

### 400 Bad Request on Signup

**Check these in order:**

1. **Verify MongoDB URL is set**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for `[v0]` logs
   - Check if you see "Connecting to database..." log
   - If not, MongoDB URL is not set

2. **Check MongoDB Connection**
   - Verify `MONGODB_URL` in `.env.local` is correct
   - Test connection in MongoDB Atlas dashboard
   - Ensure cluster is active (not paused)
   - Check IP whitelist: Add `0.0.0.0/0` for development

3. **Validate Input**
   - Email must be valid format (user@example.com)
   - Password must be at least 6 characters
   - Name must not be empty

4. **Check Server Logs**
   - Look at terminal where `npm run dev` is running
   - Check for error messages
   - Look for `[v0]` debug logs

### Cannot Connect to MongoDB

**Solution**:
1. Verify MongoDB Atlas cluster is active
2. Check IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for development)
3. Verify connection string is correct
4. Check network connectivity
5. Try connecting with MongoDB Compass to test connection

### Login Not Working

**Solution**:
1. Ensure user account exists (check signup first)
2. Verify email and password are correct
3. Check browser console (F12) for error messages
4. Clear localStorage: `localStorage.clear()` in console
5. Try signup again

### Admin Login Not Working

**Solution**:
1. Run `npm run create-admin` to ensure admin exists
2. Use correct credentials: admin@samarpan.com / admin@123
3. Check MongoDB for admin collection
4. Check browser console for detailed error messages

## Debugging with Console Logs

The application includes detailed console logging with `[v0]` prefix. To debug:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for `[v0]` logs
4. Follow the flow:
   - `[v0] Signup request received`
   - `[v0] Request body: { email, name }`
   - `[v0] Connecting to database...`
   - `[v0] Checking if user exists...`
   - `[v0] Hashing password...`
   - `[v0] Creating user...`
   - `[v0] User created successfully`

If you see an error, it will show exactly where it failed.

## Deployment to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `MONGODB_URL`
   - `JWT_SECRET`
4. Deploy

## Database Schema

### Users Collection
\`\`\`javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  name: String,
  bloodGroup: String,
  location: String,
  phone: String,
  role: String ("user" or "admin"),
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### Admins Collection
\`\`\`javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  name: String,
  role: String ("admin"),
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### Notifications Collection
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

## Security Notes

1. **JWT Secret**: Change `JWT_SECRET` in production
2. **Password**: Passwords are hashed with bcrypt
3. **Admin Password**: Change default admin password immediately
4. **HTTPS**: Always use HTTPS in production
5. **Environment Variables**: Never commit `.env.local` to git

## Support

For issues or questions:
1. Check browser console (F12) for `[v0]` logs
2. Check terminal for server errors
3. Refer to the troubleshooting section above
4. Verify all environment variables are set correctly
