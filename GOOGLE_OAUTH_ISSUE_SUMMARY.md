# Google OAuth Authentication Fix — Issue Summary & Resolution

## 🚨 Issue Description

**Error:** `Failed to exchange authorization code` on production (`https://samarpan-mu.vercel.app/login?error=Failed%20to%20exchange%20authorization%20code&google_error=true`)

**Symptoms:**
- User clicks "Sign in with Google"
- Google account selection works
- Redirect back to `samarpan-mu.vercel.app/api/auth/google/callback` fails
- User is redirected to error page instead of dashboard

---

## 🔍 Root Causes Identified

### 1. **Missing Environment Variables on Vercel**
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` not set in Vercel dashboard
- Production app cannot authenticate with Google's OAuth server

### 2. **Hardcoded Development URL**
- `.env.local` has `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- On Vercel, this wasn't overridden with production domain
- Redirect URIs were pointing to wrong domain

### 3. **Unregistered Redirect URI**
- Production redirect URI (`https://samarpan-mu.vercel.app/api/auth/google/callback`) not registered in Google Cloud Console
- Google rejects the authorization code exchange due to redirect URI mismatch

### 4. **Brittle Domain Handling**
- Code relied on `process.env.NEXT_PUBLIC_APP_URL` for server-side redirects
- This environment variable wasn't set in Vercel, causing all redirects to fail

---

## ✅ Fixes Applied

### 1. **Enhanced Callback Route** (`app/api/auth/google/callback/route.ts`)

**What was changed:**
- Modified GET handler to dynamically extract origin from request headers
- Modified POST handler to dynamically extract origin from request headers
- Updated `handleGoogleCallback()` function to accept optional `redirectUri` parameter
- Improved error logging to show redirect URI and environment variable status

**Why it matters:**
```typescript
// BEFORE: Relied on environment variable (often not set on Vercel)
redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

// AFTER: Dynamically extracted from request headers (always correct)
const origin = request.headers.get("x-forwarded-proto")
  ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("x-forwarded-host")}`
  : request.nextUrl.origin
const redirectUri = `${origin}/api/auth/google/callback`
```

**Benefits:**
- Works on any domain (localhost, Vercel production, staging, etc.)
- No need to configure different environment variables per deployment
- Automatically adapts to the request domain

### 2. **Improved Error Logging**

Added detailed logging to aid debugging:
```
[Google Auth] Token exchange failed:
  Status: 400
  Response: { error: 'invalid_grant', error_description: '...' }
  Used redirect_uri: https://samarpan-mu.vercel.app/api/auth/google/callback
  Client ID: SET (or MISSING)
  Client Secret: SET (or MISSING)
```

This makes it immediately clear what's wrong.

---

## 📋 Configuration Required (User Action)

### Step 1: Update Google Cloud Console

Add production redirect URI to registered list:
```
https://samarpan-mu.vercel.app/api/auth/google/callback
```

**URL:** https://console.cloud.google.com/ → APIs & Services → Credentials

### Step 2: Set Vercel Environment Variables

**URL:** https://vercel.com/dashboard → Samarpan → Settings → Environment Variables

Required variables for **ALL environments** (Production, Preview, Development):

```
GOOGLE_CLIENT_ID=1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com
MONGODB_URL=mongodb+srv://saksham:phmbjkvjOzw37KhZ@samarpan.j05aoqs.mongodb.net/?appName=Samarpan
```

**Note:** `NEXT_PUBLIC_APP_URL` is no longer required (handled dynamically), but can be set if needed for other purposes.

### Step 3: Redeploy

Redeploy after setting environment variables:
- Via Vercel Dashboard: Deployments → [Latest] → ... → Redeploy
- Or push to trigger auto-deploy: `git commit --allow-empty -m "Redeploy" && git push`

---

## 🧪 Testing

### Local Testing
```bash
pnpm install
pnpm run dev
# Visit http://localhost:3000/login
# Test Google sign-in
```

### Production Testing
1. Visit https://samarpan-mu.vercel.app/login
2. Click "Sign in with Google"
3. Select account → Should redirect to dashboard
4. Check Vercel logs for `[Google Auth] Successfully exchanged code for tokens`

### Debugging Vercel Logs
```
Vercel Dashboard → Deployments → [Latest] → Logs
Search for: [Google Auth]
```

---

## 🔒 Security Implications

✅ **Improved:**
- Dynamic redirect URI handling reduces dependency on fragile environment variables
- Better error logging helps identify configuration issues quickly
- Works with any future deployment domain without code changes

⚠️ **Maintain:**
- Never commit `.env.local` with real credentials to Git
- Keep `GOOGLE_CLIENT_SECRET` private (only in Vercel environment variables)
- Regularly rotate credentials (recommend quarterly)
- Use restricted Google OAuth scopes in production

---

## 📚 Files Modified

| File | Change |
|------|--------|
| `app/api/auth/google/callback/route.ts` | Dynamic origin extraction, enhanced logging, redirectUri parameter |

## 📚 Files Created

| File | Purpose |
|------|---------|
| `VERCEL_OAUTH_SETUP.md` | Quick action guide (15-minute fix) |
| `GOOGLE_OAUTH_FIX.md` | Comprehensive troubleshooting guide |
| `GOOGLE_OAUTH_ISSUE_SUMMARY.md` | This document |

---

## 🎯 Expected Outcome

After applying all fixes:
1. User clicks "Sign in with Google" on production
2. Google OAuth flow completes successfully
3. User is redirected to dashboard (not error page)
4. Token stored in secure HTTP-only cookie
5. User session persists across page refreshes

---

## ⏱️ Timeline to Resolution

- **Configuration (user):** 15 minutes
- **Redeploy on Vercel:** 2-3 minutes
- **Propagate DNS/CDN:** 1-2 minutes
- **Total:** ~20 minutes

---

## 🆘 If Still Not Working

1. **Verify Vercel logs:**
   - Look for `[Google Auth] Token exchange failed`
   - Check what redirect_uri was actually used
   - Confirm Client ID and Secret are SET

2. **Verify Google Cloud Console:**
   - Redirect URI exactly matches (case-sensitive)
   - OAuth credentials haven't been deleted/rotated

3. **Nuclear option:**
   - Delete all environment variables from Vercel
   - Re-add them one by one
   - Redeploy after each change
   - Test locally first with same credentials

---

## 📖 Related Documentation

- `VERCEL_OAUTH_SETUP.md` — Quick action guide
- `GOOGLE_OAUTH_FIX.md` — Detailed troubleshooting
- `EMAIL_FEATURES_USAGE.md` — Environment variables reference
- `DEPLOYMENT_FIX.md` — General deployment issues