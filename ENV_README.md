# Environment Variables Setup

This document explains all the environment variables needed for the Samarpan application.

## Required Environment Variables

### Database Configuration
- **MONGODB_URL**: Your MongoDB connection string
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/?appName=Samarpan`
  - Example: `mongodb+srv://samarpan:lbBAnhIT4lrkpZes@samarpan.pftbejf.mongodb.net/?appName=Samarpan`
  - Get this from your MongoDB Atlas dashboard

### Authentication
- **JWT_SECRET**: Secret key for JWT token signing (optional, has default)
  - Default: `your-secret-key-change-in-production`
  - Recommended: Generate a strong random string for production
  - Example: `your-super-secret-jwt-key-12345`

## Setup Instructions

1. Create a `.env.local` file in the root directory of your project

2. Add the following variables:
\`\`\`
MONGODB_URL=mongodb+srv://samarpan:lbBAnhIT4lrkpZes@samarpan.pftbejf.mongodb.net/?appName=Samarpan
JWT_SECRET=your-super-secret-jwt-key-12345
\`\`\`

3. Save the file

4. Restart your development server

## Database Collections

The application automatically uses the following MongoDB collections:

- **users**: Stores user account information
  - Fields: email, password, name, bloodGroup, location, phone, lastDonationDate, role, createdAt

- **admins**: Stores admin account information
  - Fields: email, password, name, role, createdAt

- **notifications**: Stores notifications sent to users
  - Fields: userId, title, message, createdAt

## Creating Admin Account

To create an admin account, run the following script:

\`\`\`bash
npm run create-admin
\`\`\`

This will create an admin with:
- Email: `admin@samarpan.com`
- Password: `admin@123`

**Important**: Change the password after first login!

## Production Deployment

For production deployment on Vercel:

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add the following variables:
   - `MONGODB_URL`: Your production MongoDB connection string
   - `JWT_SECRET`: A strong random secret key

4. Redeploy your application

## Security Notes

- Never commit `.env.local` to version control
- Always use strong passwords for admin accounts
- Change default admin password immediately after creation
- Use environment-specific connection strings for development and production
- Rotate JWT_SECRET periodically in production
