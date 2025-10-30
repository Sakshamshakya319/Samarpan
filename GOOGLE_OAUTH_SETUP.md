# Google OAuth Login Setup Guide

This guide explains how to set up Google OAuth 2.0 authentication for Samarpan, which automatically creates user accounts in MongoDB.

## Overview

The Google OAuth implementation:
- Authenticates users via their Google accounts
- Automatically creates new user profiles in MongoDB
- Supports account linking (connecting Google to existing email accounts)
- Uses the same JWT token system as email/password login
- Stores user data securely in MongoDB

## Step 1: Get Google OAuth Credentials

### A. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a Project"** at the top
3. Click **"NEW PROJECT"**
4. Enter project name: `Samarpan Blood Donation`
5. Click **"CREATE"**

### B. Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services**
2. Click **"ENABLE APIS AND SERVICES"**
3. Search for **"Google+ API"**
4. Click on it and click **"ENABLE"**

### C. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen first:
   - Click **"CONFIGURE CONSENT SCREEN"**
   - Choose **"External"** user type
   - Click **"CREATE"**
   - Fill in:
     - **App name**: `Samarpan`
     - **User support email**: Your email
     - **Developer contact**: Your email
   - Click **"SAVE AND CONTINUE"**
   - On "Scopes" page, click **"SAVE AND CONTINUE"**
   - Click **"SAVE AND CONTINUE"** again
   - Review and click **"BACK TO DASHBOARD"**

4. Now create the OAuth client ID:
   - Go to **Credentials** again
   - Click **"CREATE CREDENTIALS"** → **"OAuth client ID"**
   - Choose **"Web application"**
   - Enter name: `Samarpan Web Client`
   - Under **"Authorized redirect URIs"**, add:
     - `http://localhost:3000/api/auth/google/callback` (development)
     - `http://localhost:3000/login/google-callback` (development - for page redirect)
   - Click **"CREATE"**

5. Copy the credentials:
   - **Client ID** (starts with `.apps.googleusercontent.com`)
   - **Client Secret**

## Step 2: Update Environment Variables

### For Development

Edit `.env.local`:

```env
MONGODB_URL=mongodb+srv://saksham:phmbjkvjOzw37KhZ@samarpan.j05aoqs.mongodb.net/?appName=Samarpan

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### For Production

Update your production `.env`:

```env
MONGODB_URL=your_production_mongodb_url

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

And add to Google Cloud Console authorized redirect URIs:
- `https://yourdomain.com/api/auth/google/callback`
- `https://yourdomain.com/login/google-callback`

## Step 3: Verify Installation

1. Check that dependencies are installed:
   ```bash
   npm list google-auth-library
   ```

2. If `google-auth-library` is not installed, run:
   ```bash
   npm install google-auth-library --legacy-peer-deps
   ```

3. The following files should exist:
   - `app/api/auth/google/callback/route.ts` - Backend OAuth callback
   - `components/google-login-button.tsx` - Google login button component
   - `app/(public)/login/google-callback/page.tsx` - OAuth redirect handler

## Step 4: Test Google Login

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`

3. Click **"Sign in with Google"** button

4. You should be redirected to Google's login page

5. After authentication, you'll be redirected back to your app

6. Check MongoDB to verify the user was created:
   ```bash
   # Query your MongoDB to see the new user
   db.users.find({ oauthProvider: "google" })
   ```

## How It Works

### User Login Flow

```
User clicks "Sign in with Google"
    ↓
Redirects to Google OAuth consent screen
    ↓
User grants permission
    ↓
Google redirects with authorization code
    ↓
Backend exchanges code for access token
    ↓
Backend fetches user info from Google
    ↓
Backend checks MongoDB for existing user
    ├─ If exists: Updates googleId
    └─ If not exists: Creates new user
    ↓
Backend generates JWT token
    ↓
User redirected to dashboard with token
```

### MongoDB User Schema

When a user signs in with Google, this record is created:

```javascript
{
  _id: ObjectId,
  email: "user@gmail.com",
  name: "John Doe",
  googleId: "1234567890",                    // Google's unique ID
  oauthProvider: "google",                   // OAuth provider
  avatar: "https://lh3.googleusercontent..." // Google profile picture
  bloodGroup: "",
  location: "",
  phone: "",
  role: "user",
  lastDonationDate: null,
  totalDonations: 0,
  hasDisease: false,
  diseaseDescription: "",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

## Features

### 1. **Automatic Account Creation**
Users with Google accounts are automatically added to your database without manual registration.

### 2. **Account Linking**
If a user tries to sign in with Google using an email that already exists in the database (from email/password signup), their Google account is linked to the existing profile.

### 3. **One-Click Login**
Users with existing accounts can log in with just one click using Google.

### 4. **Profile Picture**
Google profile pictures are automatically stored in the `avatar` field.

### 5. **No Password Storage**
Users authenticating via Google don't have passwords stored in your database - they're entirely managed by Google.

## API Endpoints

### POST `/api/auth/google/callback`

Handles the OAuth callback from Google.

**Request Body:**
```json
{
  "code": "4/0AbUR2VR..."
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@gmail.com",
    "name": "John Doe",
    "bloodGroup": "",
    "location": "",
    "phone": "",
    "avatar": "https://...",
    "role": "user"
  }
}
```

**Set-Cookie:** HTTP-only token cookie

## Troubleshooting

### Issue: "Authorization code required"
- **Cause**: Authorization code not sent from frontend
- **Solution**: Ensure Google OAuth flow is initiated correctly

### Issue: "Failed to exchange authorization code"
- **Cause**: Invalid Client ID or Secret
- **Solution**: Verify credentials in Google Cloud Console and `.env.local`

### Issue: "Invalid state parameter"
- **Cause**: CSRF token mismatch
- **Solution**: Clear browser cache and cookies, try again

### Issue: "Redirect URI mismatch"
- **Cause**: Redirect URI not registered in Google Cloud Console
- **Solution**: Add exact redirect URIs to authorized list:
  - `http://localhost:3000/api/auth/google/callback`
  - `http://localhost:3000/login/google-callback`

### Issue: User not created in MongoDB
- **Cause**: MongoDB connection issue or missing environment variables
- **Solution**: 
  - Check `MONGODB_URL` is correct
  - Verify database connectivity: `mongo <connection_string>`
  - Check server logs for errors

### Issue: "Google Client ID not configured"
- **Cause**: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` not set
- **Solution**: Add to `.env.local`:
  ```env
  NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
  ```

## Security Considerations

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use HTTPS in production** - Required for secure OAuth
3. **Validate JWT tokens** - Always verify tokens on protected routes
4. **CSRF Protection** - State parameter is validated on callback
5. **Secure cookies** - Tokens stored in HTTP-only cookies
6. **Access token scoped** - Only requests `openid`, `email`, `profile` scopes

## Next Steps

1. ✅ Install dependencies (`google-auth-library`)
2. ✅ Get Google OAuth credentials from Google Cloud Console
3. ✅ Update `.env.local` with credentials
4. ✅ Test Google login flow
5. ✅ Verify user creation in MongoDB
6. ✅ Deploy to production with production Google credentials

## Support

For issues or questions:
1. Check MongoDB connection
2. Verify Google Cloud Console configuration
3. Check environment variables
4. Review server logs: `npm run dev` output
5. Inspect browser console for client-side errors

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Authorization Code Flow](https://developers.google.com/identity/protocols/oauth2/web-server-flow)