# Quick Fix: Google OAuth on Vercel (samarpan-mu.vercel.app)

## 🚨 Current Problem
Login fails with: **"Failed to exchange authorization code"**

## ✅ Your Action Items (15 minutes)

### Step 1: Update Google Cloud Console (2 min)
**URL:** https://console.cloud.google.com/

1. Find your project "Samarpan" (or create OAuth app if missing)
2. Go to **APIs & Services → Credentials**
3. Click on your OAuth 2.0 Client ID (Desktop/Web app)
4. Under **Authorized redirect URIs**, paste EXACTLY:
   ```
   https://samarpan-mu.vercel.app/api/auth/google/callback
   ```
5. Add this if not already there:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
6. Click **Save**

✓ Your Credentials:
- **Client ID:** `1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com`
- **Client Secret:** `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`

---

### Step 2: Set Vercel Environment Variables (5 min)
**URL:** https://vercel.com/dashboard

1. Select **Samarpan** project
2. Click **Settings** → **Environment Variables**
3. **DELETE any old/incorrect variables**, then add these:

| Name | Value | Environments |
|------|-------|--------------|
| `GOOGLE_CLIENT_ID` | `1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com` | ✅ Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | `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` | ✅ Production, Preview, Development |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com` | ✅ Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://samarpan-mu.vercel.app` | ✅ Production, Preview, Development |
| `MONGODB_URL` | `mongodb+srv://saksham:phmbjkvjOzw37KhZ@samarpan.j05aoqs.mongodb.net/?appName=Samarpan` | ✅ Production, Preview, Development |

**IMPORTANT:** For each variable, ensure **ALL THREE environment checkboxes are checked** (Production ✓, Preview ✓, Development ✓)

4. Click **Save** for each

---

### Step 3: Redeploy on Vercel (3 min)
**URL:** https://vercel.com/dashboard

1. Go to **Deployments**
2. Find the latest deployment 
3. Click the **•••** menu → **Redeploy**
4. Wait for deployment to complete (≈2-3 min)

OR commit and push to trigger auto-deploy:
```bash
git commit --allow-empty -m "Redeploy with updated OAuth vars"
git push
```

---

### Step 4: Test (1 min)

1. Open https://samarpan-mu.vercel.app/login
2. Click **"Sign in with Google"**
3. Select your account
4. ✅ Should redirect to dashboard (not to error page)

---

## 🔍 Verify the Fix Worked

**Logs to check:**
1. Vercel Dashboard → **Deployments** → **[Latest]** → **Logs**
2. Search for `[Google Auth]`
3. You should see:
   ```
   [Google Auth] GET callback received
   [Google Auth] Processing authorization code...
   [Google Auth] Exchanging authorization code for tokens...
   [Google Auth] Successfully exchanged code for tokens
   [Google Auth] Fetching user information...
   [Google Auth] User info retrieved: { email: '...', name: '...' }
   ```

**If still failing:**
- Check logs for error message
- Verify redirect URI matches exactly in Google Console
- Ensure all env vars are set in ALL THREE environments
- Redeploy after any changes

---

## 📝 Local Testing (Optional)

To test locally with same credentials:

```bash
# Install dependencies
pnpm install

# Create/update .env.local with:
GOOGLE_CLIENT_ID=1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
MONGODB_URL=mongodb+srv://saksham:phmbjkvjOzw37KhZ@samarpan.j05aoqs.mongodb.net/?appName=Samarpan

# Start dev server
pnpm run dev

# Visit http://localhost:3000/login
# Test Google login
```

---

## ⚠️ Security Reminders

- **Never commit `.env.local` to Git** (should be in `.gitignore`)
- Keep `GOOGLE_CLIENT_SECRET` private (only in environment variables)
- For production, use restricted Google OAuth scopes if possible
- Rotate credentials quarterly

---

## 🆘 If Still Not Working

1. **Check Vercel Logs:**
   - Vercel Dashboard → Deployments → [Latest] → Logs → Search for `[Google Auth]`

2. **Common Errors:**
   - `redirect_uri mismatch` → Google Console redirect URI wrong or missing
   - `Invalid Client ID` → Env var not set in Vercel
   - `Invalid Client Secret` → Typo in secret, check copy-paste

3. **Nuclear Option (Last Resort):**
   - Delete all env vars from Vercel
   - Re-add them one by one carefully
   - Redeploy after each change
   - Verify in logs

---

**Expected time to fix: 15 minutes**
**After redeploy completes: 2-3 minutes to take effect**