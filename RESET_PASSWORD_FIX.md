# Password Reset Email Fix

## Problem Summary

After deployment, users were not receiving the password reset link with the correct domain. The reset emails were being sent, but the links contained incorrect URLs (likely localhost or wrong domain).

### What Was Happening

**Local Development (Working ✅):**
- User requests password reset
- Email sent with link: `http://localhost:3000/reset-password?token=...`
- Link works perfectly

**Production (Broken ❌):**
- User requests password reset
- Email sent with incorrect link: `http://internal-server:3000/reset-password?token=...` or similar
- User clicks link, gets 404 or wrong page

## Root Cause

The password reset link generation in `/app/api/auth/forgot-password/route.ts` was:

1. **Trying to infer the domain from request headers** - This doesn't work reliably in production
2. **Not using the `NEXT_PUBLIC_APP_URL` environment variable** - Which should be the source of truth
3. **Falling back to `request.nextUrl.origin`** - Which gives wrong results behind proxies/load balancers

## The Fix

### Code Change

Updated `/app/api/auth/forgot-password/route.ts` to:

```typescript
// BEFORE (unreliable):
const origin = request.headers.get("x-forwarded-proto")
  ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("x-forwarded-host")}`
  : request.nextUrl.origin
const resetLink = `${origin}/reset-password?token=${resetToken}`

// AFTER (reliable):
let appUrl = process.env.NEXT_PUBLIC_APP_URL

if (!appUrl) {
  // Fallback to request headers if env var not set
  appUrl = request.headers.get("x-forwarded-proto")
    ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("x-forwarded-host")}`
    : request.nextUrl.origin
}

const resetLink = `${appUrl}/reset-password?token=${resetToken}`
console.log(`[Password Reset] Reset link: ${resetLink} (using appUrl: ${appUrl})`)
```

### What This Does

1. **Prioritizes `NEXT_PUBLIC_APP_URL`** - Uses the environment variable you explicitly set
2. **Falls back safely** - If env var missing, tries request headers as fallback
3. **Logs the URL** - Helps debug issues in production logs
4. **Reliable** - Works consistently across all deployment platforms (Vercel, Heroku, AWS, etc.)

## Deployment Fix Checklist

### Step 1: Update Your Deployment Environment

In your deployment platform (Vercel, Heroku, etc.), set:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Examples:**
- Vercel: `https://my-app.vercel.app`
- Custom domain: `https://samarpan.yourdomain.com`
- Heroku: `https://your-app-name.herokuapp.com`

### Step 2: Verify Other Environment Variables

Make sure these are also set correctly:

```env
# Email Configuration (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.YOUR_SENDGRID_API_KEY_HERE
SMTP_FROM="Samarpan <noreply@yourdomain.com>"

# Database
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/samarpan

# Other variables
JWT_SECRET=your-secure-random-string
```

### Step 3: Redeploy

For Vercel:
1. Go to Vercel Dashboard
2. Select your project
3. Click **Settings → Environment Variables**
4. Add/update `NEXT_PUBLIC_APP_URL`
5. Go back to **Deployments**
6. Click on latest deployment → **Redeploy**

For other platforms:
- Update environment variables in your platform's dashboard
- Trigger a new deployment (usually via git push)

### Step 4: Test the Fix

1. Go to your deployed app
2. Click **Login** → **Forgot Password**
3. Enter your email
4. Check your email inbox (and spam folder)
5. Click the reset link
6. **Verify the URL is correct** (should be your domain, not localhost)
7. Complete the password reset

## How to Debug

### Check Server Logs

Look for this log message:
```
[Password Reset] Reset link: https://yourdomain.com/reset-password?token=abc123...
```

If you see:
- ✅ `https://yourdomain.com` - Correct!
- ❌ `http://localhost:3000` - `NEXT_PUBLIC_APP_URL` not set
- ❌ `http://some-internal-ip:3000` - Check your deployment config

### Check Email Logs

**In SendGrid Dashboard:**
1. Go to **Activity → Logs**
2. Find the password reset email
3. Click it to see full details
4. Check the reset link in the email body

**Verify the link looks like:**
```
https://yourdomain.com/reset-password?token=...
```

### What to Do If Still Not Working

1. **Confirm environment variable is set:**
   ```bash
   # Check in your deployment platform's env var section
   # Verify NEXT_PUBLIC_APP_URL is exactly your domain
   ```

2. **Check for typos:**
   - No trailing slash: ✅ `https://yourdomain.com` (not `https://yourdomain.com/`)
   - Correct protocol: ✅ `https://` (not `http://`)
   - No extra spaces

3. **Verify SMTP configuration:**
   - SendGrid API key is valid
   - Sender email is verified in SendGrid
   - Check SendGrid Activity logs for delivery status

4. **Look at deployment logs:**
   - Vercel: Check build logs and function logs
   - Other: Check application server logs

## Environment Variable Summary

| Variable | Location | Purpose | Example |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_APP_URL` | **DEPLOYMENT PLATFORM** | Reset link domain | `https://yourdomain.com` |
| `MONGODB_URL` | **DEPLOYMENT PLATFORM** | Database connection | `mongodb+srv://...` |
| `SMTP_PASS` | **DEPLOYMENT PLATFORM** | SendGrid API key | `SG.abc123...` |
| `JWT_SECRET` | **DEPLOYMENT PLATFORM** | Auth secret | Random 32+ chars |

⚠️ **IMPORTANT:** These should be set in your **deployment platform**, not in `.env` file!

- ✅ Add to Vercel → Settings → Environment Variables
- ✅ Add to Heroku → Settings → Config Vars
- ❌ DO NOT add to `.env` or `.env.local` in git

## Verification Checklist

After deployment and before considering it fixed:

- [ ] Deployment platform has `NEXT_PUBLIC_APP_URL` set to your domain
- [ ] Latest code is deployed
- [ ] Test forgot password flow end-to-end
- [ ] Email received with correct reset link URL
- [ ] Clicking reset link works (no 404)
- [ ] Password reset completes successfully
- [ ] Can login with new password
- [ ] No errors in deployment platform logs

## Additional Resources

- **Full Deployment Guide:** See `DEPLOYMENT.md` in the repo
- **Email Configuration:** See `DEPLOYMENT.md` → Email Configuration section
- **Vercel Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables
- **SendGrid Setup:** https://sendgrid.com/docs/for-developers/

---

## Questions?

If you still have issues after following this guide:

1. Check the logs in your deployment platform
2. Verify all environment variables are correctly set
3. Test the API endpoint directly:
   ```bash
   curl -X POST https://yourdomain.com/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@example.com"}'
   ```
4. Review `DEPLOYMENT.md` for troubleshooting section