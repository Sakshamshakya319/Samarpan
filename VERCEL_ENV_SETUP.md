# Vercel Environment Variables Setup - Step by Step

## Problem
You got error: `Environment Variable "MONGODB_URL" references Secret "mongodb_url", which does not exist`

**This is fixed now.** The `vercel.json` has been simplified. Follow these steps to add environment variables through the Vercel dashboard.

---

## Step 1: Go to Vercel Dashboard

1. Open https://vercel.com/dashboard
2. Select your project (Samarpan)
3. Click **Settings** tab (top menu)

---

## Step 2: Navigate to Environment Variables

1. In left sidebar, click **Environment Variables**
2. You should see a form that says "Add New"

---

## Step 3: Add Each Variable

Click **Add New** for each of these 5 variables:

### Variable 1: MONGODB_URL
- **Name:** `MONGODB_URL`
- **Value:** 
  ```
  mongodb+srv://saksham:phmbjkvjOzw37KhZ@samarpan.j05aoqs.mongodb.net/?appName=Samarpan
  ```
- **Environments:** Check all three (Production, Preview, Development)
- Click **Save**

### Variable 2: GOOGLE_CLIENT_ID
- **Name:** `GOOGLE_CLIENT_ID`
- **Value:** 
  ```
  1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com
  ```
- **Environments:** Check all three
- Click **Save**

### Variable 3: GOOGLE_CLIENT_SECRET
- **Name:** `GOOGLE_CLIENT_SECRET`
- **Value:** 
  ```
  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
  ```
- **Environments:** Check all three
- Click **Save**

### Variable 4: NEXT_PUBLIC_GOOGLE_CLIENT_ID
- **Name:** `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- **Value:** 
  ```
  1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com
  ```
- **Environments:** Check all three
- Click **Save**

### Variable 5: NEXT_PUBLIC_APP_URL
- **Name:** `NEXT_PUBLIC_APP_URL`
- **Value:** 
  ```
  https://samarpan.vercel.app
  ```
  (Or your actual Vercel project URL - check your Vercel dashboard for the exact URL)
- **Environments:** Check all three
- Click **Save**

---

## Step 4: Verify All Variables Added

After adding all 5, you should see them listed:
- ✅ MONGODB_URL
- ✅ GOOGLE_CLIENT_ID
- ✅ GOOGLE_CLIENT_SECRET
- ✅ NEXT_PUBLIC_GOOGLE_CLIENT_ID
- ✅ NEXT_PUBLIC_APP_URL

---

## Step 5: Redeploy

Option A: **Automatic (Recommended)**
1. Make a small change to your code
2. Push to GitHub
3. Vercel auto-deploys

Option B: **Manual Redeploy**
1. Go to **Deployments** tab
2. Find latest deployment
3. Click **...** menu → **Redeploy**

---

## Step 6: Monitor Build

1. Go to **Deployments** tab
2. Click the latest deployment
3. Watch build progress (should take 2-3 minutes)
4. Check for errors in the build logs

---

## Common Issues

### Issue: Build still fails with "Missing variable"
**Solution:** 
- Make sure all 5 variables are added
- Check spelling exactly matches above
- Redeploy after adding variables

### Issue: Environment variables showing as "undefined" in logs
**Solution:**
- Confirm all variables are set for "Production" environment
- Redeploy (variables only apply to new deployments)

### Issue: Google OAuth returns 400 error
**Solution:**
- Verify `GOOGLE_CLIENT_ID` is exactly from Google Cloud Console
- Check Google Cloud OAuth consent screen has the Vercel URL added
- Verify callback URL in Google Cloud: `https://samarpan.vercel.app/api/auth/google/callback`

---

## What Your Vercel Dashboard Should Look Like

```
Settings → Environment Variables

MONGODB_URL
├─ Value: mongodb+srv://saksham:...
└─ Environments: Production, Preview, Development ✓

GOOGLE_CLIENT_ID
├─ Value: 1000323711355-g1dkc8ktb...
└─ Environments: Production, Preview, Development ✓

GOOGLE_CLIENT_SECRET
├─ Value: GOCSPX-qvCkZpnyCuf1...
└─ Environments: Production, Preview, Development ✓

NEXT_PUBLIC_GOOGLE_CLIENT_ID
├─ Value: 1000323711355-g1dkc8ktb...
└─ Environments: Production, Preview, Development ✓

NEXT_PUBLIC_APP_URL
├─ Value: https://samarpan.vercel.app
└─ Environments: Production, Preview, Development ✓
```

---

## After Deploy: Test Your App

1. Go to your Vercel URL: `https://samarpan.vercel.app`
2. Test Google OAuth login
3. Verify redirect to dashboard
4. Check user profile loads

---

## Still Having Issues?

Check the build logs:
1. Go to **Deployments** tab
2. Click latest deployment
3. Scroll down to **Logs** section
4. Look for specific error message
5. Reference the error in our troubleshooting guide

If MongoDB connection error:
- Verify `MONGODB_URL` is correct from `.env.local`
- Check MongoDB Atlas allows Vercel IPs (IP whitelist)

If Google OAuth error:
- Verify both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
- Check Google Cloud Console OAuth app settings