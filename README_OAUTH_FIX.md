# 🔧 Google OAuth Fix — Action Guide

## TL;DR — 15 Minute Fix

You are seeing **"Failed to exchange authorization code"** because Google OAuth environment variables and redirect URIs are not configured on your production server.

### ✅ What You Need To Do Now:

1. **Update Google Cloud Console** (2 min)
   - Go to: https://console.cloud.google.com/
   - Find your OAuth 2.0 Client ID
   - Add this redirect URI: `https://samarpan-mu.vercel.app/api/auth/google/callback`
   - Save

2. **Set Environment Variables on Vercel** (5 min)
   - Go to: https://vercel.com/dashboard
   - Select "Samarpan" project
   - Settings → Environment Variables
   - Add these variables (check ALL environments: Production, Preview, Development):
     ```
     GOOGLE_CLIENT_ID=1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=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
     NEXT_PUBLIC_GOOGLE_CLIENT_ID=1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com
     ```

3. **Redeploy** (3 min)
   - Vercel Dashboard → Deployments → Click latest → ... menu → Redeploy
   - Wait 2-3 minutes for deployment

4. **Test** (1 min)
   - Visit: https://samarpan-mu.vercel.app/login
   - Click "Sign in with Google"
   - If it works → ✅ Done!
   - If still broken → See troubleshooting section below

---

## 📋 Detailed Documentation

**Three comprehensive guides were created:**

| File | Purpose | When to Read |
|------|---------|--------------|
| **VERCEL_OAUTH_SETUP.md** | Step-by-step setup guide | Use this if unsure about any step |
| **GOOGLE_OAUTH_FIX.md** | Complete troubleshooting & debugging | For troubleshooting or learning |
| **GOOGLE_OAUTH_ISSUE_SUMMARY.md** | Technical analysis of root causes | For understanding what went wrong |

---

## 🔍 Verify Your Fix

### Check 1: Vercel Logs
```
Vercel Dashboard → Deployments → [Latest Deployment] → Logs
Search for: [Google Auth]

Expected to see:
[Google Auth] GET callback received
[Google Auth] Processing authorization code...
[Google Auth] Exchanging authorization code for tokens...
[Google Auth] Successfully exchanged code for tokens
```

### Check 2: Manual Test
```
https://samarpan-mu.vercel.app/login → Click "Sign in with Google" → Select account
Result: Should redirect to dashboard (not error page)
```

---

## 🆘 Troubleshooting

### Still Getting "Failed to exchange authorization code"?

**1. Check Redirect URI Mismatch**
```
Error: "The redirect_uri parameter does not match"
→ Solution: Verify Google Cloud Console has EXACTLY:
   https://samarpan-mu.vercel.app/api/auth/google/callback
   (Note: case-sensitive, no trailing slash)
```

**2. Check Missing Environment Variables**
```
Vercel logs show: "Client ID: MISSING" or "Client Secret: MISSING"
→ Solution: 
   - Verify env vars are set in Vercel Dashboard
   - Ensure ALL THREE environments are checked (Production ✓ Preview ✓ Development ✓)
   - Redeploy after adding variables
```

**3. Check Stale Deployment**
```
Env vars were updated but Vercel still using old code
→ Solution: 
   - Click Redeploy in Vercel Dashboard
   - Or push a commit: git commit --allow-empty -m "Trigger redeploy" && git push
```

**4. Test Locally First**
```bash
# Create .env.local with same credentials
pnpm install
pnpm run dev
# Visit http://localhost:3000/login
# If local works but production doesn't → issue is Vercel config
# If local fails too → credentials are wrong or Google Cloud needs update
```

---

## 💡 What Was Fixed in the Code

The production deployment now:

✅ **Dynamically detects the domain** (localhost, vercel.app, etc.)
✅ **No longer relies on hardcoded environment variables** for redirects
✅ **Provides detailed error logs** showing exactly what redirect URI was used
✅ **Works on any deployment domain** without code changes

**Before:** Redirect URI had to be manually configured per environment
**After:** Automatically uses the current request domain

---

## 🔐 Security Reminders

- ⚠️ Never commit `.env.local` with real credentials to Git
- ⚠️ Keep `GOOGLE_CLIENT_SECRET` private (only in environment variables)
- ✅ Use separate OAuth credentials for production vs development
- ✅ Rotate credentials every 90 days

---

## 📞 Need Help?

1. **Read the detailed guides:**
   - `VERCEL_OAUTH_SETUP.md` for setup help
   - `GOOGLE_OAUTH_FIX.md` for troubleshooting

2. **Check Vercel logs:**
   - Look for `[Google Auth]` messages
   - They'll tell you exactly what's failing

3. **Verify Google Cloud Console:**
   - Redirect URI must match exactly
   - Don't forget `https://` (not just `http://`)

---

## ✨ Testing Checklist

After applying the fix, verify:

- [ ] Environment variables set in Vercel (all 3 environments)
- [ ] Google Cloud Console has production redirect URI registered
- [ ] Vercel deployment completed (Deployments → shows completion)
- [ ] Vercel logs show `[Google Auth] Successfully exchanged code for tokens`
- [ ] Production login works: https://samarpan-mu.vercel.app/login
- [ ] User can see dashboard after Google sign-in
- [ ] User can refresh page and still be logged in (token persists)

---

**Expected completion time: 15-20 minutes total**

After Vercel redeploys, the fix takes effect immediately. No additional server restart needed.