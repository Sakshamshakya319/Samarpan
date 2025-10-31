# Google OAuth Fix Guide

## Problem Analysis

The "Failed to exchange authorization code" error on production (`https://samarpan-mu.vercel.app/login`) occurs because:

1. **Missing Vercel Environment Variables** — `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` not set on Vercel
2. **Incorrect NEXT_PUBLIC_APP_URL** — Still points to localhost, not the production domain
3. **Unregistered Redirect URI** — Production redirect URI not registered in Google Cloud Console

---

## Solution: Step-by-Step Fix

### Step 1: Update Google Cloud Console Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your OAuth 2.0 Client ID (Web Application)
3. Under **Authorized redirect URIs**, add **both**:
   - `https://samarpan-mu.vercel.app/api/auth/google/callback` (PRODUCTION)
   - `https://samarpan.vercel.app/api/auth/google/callback` (if using a different prod domain)
   - `http://localhost:3000/api/auth/google/callback` (local development)

4. Click **Save**

**Example of Correct URIs:**
```
http://localhost:3000/api/auth/google/callback
https://samarpan-mu.vercel.app/api/auth/google/callback
```

---

### Step 2: Configure Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Samarpan** project
3. Navigate to **Settings → Environment Variables**

4. Add/Update these variables for **All Environments** (Production, Preview, Development):

| Variable | Value | Type |
|----------|-------|------|
| `GOOGLE_CLIENT_ID` | `1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com` | String |
| `GOOGLE_CLIENT_SECRET` | `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` | String |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com` | String |
| `NEXT_PUBLIC_APP_URL` | `https://samarpan-mu.vercel.app` | String (for Production) |
| `MONGODB_URL` | Your MongoDB connection string | String |
| `SMTP_HOST` | `smtp.sendgrid.net` | String |
| `SMTP_PORT` | `587` | String |
| `SMTP_USER` | `apikey` | String |
| `SMTP_PASS` | Your SendGrid API key | String |
| `SMTP_FROM` | `"Samarpan <noreply@samarpan.com>"` | String |

**Important Notes:**
- For **Preview** deployments, set `NEXT_PUBLIC_APP_URL=https://samarpan-preview.vercel.app` (or preview branch URL)
- For **Development**, set `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- Ensure all three environment profiles are enabled for each variable

---

### Step 3: Redeploy to Vercel

After updating environment variables:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the **Samarpan** project
3. Click **Deployments**
4. Find the latest deployment
5. Click the **...** menu → **Redeploy** (this uses the updated env vars)

Alternatively, trigger redeploy via Git:
```bash
git commit --allow-empty -m "Trigger redeploy with updated env vars"
git push
```

---

### Step 4: Verify Configuration Locally

Before testing production, verify locally with the correct `.env.local`:

```env
GOOGLE_CLIENT_ID=1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
MONGODB_URL=mongodb+srv://saksham:phmbjkvjOzw37KhZ@samarpan.j05aoqs.mongodb.net/?appName=Samarpan
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=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
SMTP_FROM="Saksham Shakya <Sakshamshakya319@gmail.com>"
```

Then start development server:
```bash
pnpm install
pnpm run dev
```

Visit http://localhost:3000/login and test Google sign-in.

---

## Debugging the OAuth Flow

### Check Server Logs on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select **Samarpan** project
3. Navigate to **Deployments → [Latest] → Logs**
4. Attempt to login with Google
5. Look for `[Google Auth]` messages in logs

**Expected log sequence:**
```
[Google Auth] GET callback received
[Google Auth] Processing authorization code...
[Google Auth] Exchanging authorization code for tokens...
[Google Auth] Successfully exchanged code for tokens
[Google Auth] Fetching user information...
[Google Auth] User info retrieved: { email: '...', name: '...' }
```

**Error indicators:**
```
[Google Auth] Token exchange failed: error_description=The redirect_uri parameter...
```
This means the redirect URI in Google Cloud Console doesn't match the request.

---

## Common Issues & Solutions

### Issue 1: "Invalid Redirect URI"
**Cause:** Redirect URI in Google Cloud Console doesn't match the callback URL  
**Fix:** Update Google Cloud Console to include `https://samarpan-mu.vercel.app/api/auth/google/callback`

### Issue 2: "Invalid Client ID or Secret"
**Cause:** Environment variables not set on Vercel  
**Fix:** Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Vercel environment variables

### Issue 3: "Redirect to localhost on production"
**Cause:** `NEXT_PUBLIC_APP_URL` still set to `http://localhost:3000`  
**Fix:** Update to `https://samarpan-mu.vercel.app` in Vercel environment settings

### Issue 4: "Page keeps redirecting to /login after successful auth"
**Cause:** `NEXT_PUBLIC_APP_URL` mismatch or token not being stored  
**Fix:** Check browser console for errors, verify env vars, check localStorage for token

---

## Security Notes

⚠️ **Never commit `.env.local` with real credentials to Git!**

Ensure `.gitignore` includes:
```
.env.local
.env.*.local
```

The credentials in this guide are **examples only**. Use your actual credentials from Google Cloud Console and SendGrid.

---

## Verifying the Fix

1. Navigate to https://samarpan-mu.vercel.app/login
2. Click **"Sign in with Google"**
3. Select your Google account
4. You should be redirected to dashboard after successful authentication
5. No error message on login page

If still seeing "Failed to exchange authorization code":
- Check Vercel deployment logs for `[Google Auth]` errors
- Verify all environment variables are set in Vercel
- Confirm redirect URI is registered in Google Cloud Console
- Redeploy after making changes (settings updates require new deployment)