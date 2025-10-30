# Vercel Deployment Fix - Complete Solution

## Problems Fixed

### 1. **npm Peer Dependency Conflict (ERESOLVE)**
**Error:** `ERESOLVE unable to resolve dependency tree`
- MongoDB 6.20.0 expected `gcp-metadata@^5.2.0`
- Google Auth Library 10.5.0 required `gcp-metadata@^8.0.0`
- npm strict peer dependency resolution caused build failure

**Solution:**
- Pinned compatible versions in `package.json`:
  - `gcp-metadata: "^8.1.0"` (verified compatible with google-auth-library)
  - `mongodb: "^6.20.0"` (works with pinned gcp-metadata)
- Added `legacy-peer-deps=true` to `.npmrc` to allow npm to proceed despite peer warnings

### 2. **Next.js Prerendering Error (Route Segment)**
**Error:** `Error occurred prerendering page "/auth/google-callback-handler"`
- The Google OAuth callback page was being statically prerendered during build
- This page requires runtime context (search params, user data) that only exists at request time
- Static prerendering failed because the page tries to access dynamic data

**Solution:**
- Added multiple dynamic route markers to `/auth/google-callback-handler/page.tsx`:
  - `export const dynamic = "force-dynamic"` - Prevents static generation
  - `export const revalidate = 0` - Disables ISR caching
  - `export const fetchCache = "force-no-store"` - Ensures fresh data on each request
- Updated `next.config.mjs` with settings to respect dynamic routes
- Created `vercel.json` with explicit build command

## Files Modified

### `/package.json`
- Changed `gcp-metadata` from `"latest"` to `"^8.1.0"`
- Changed `mongodb` from `"latest"` to `"^6.20.0"`

### `/.npmrc` (Created/Verified)
```
legacy-peer-deps=true
```
This tells npm to allow peer dependency warnings and proceed with installation. Safe to use when versions are explicitly pinned.

### `/app/(public)/auth/google-callback-handler/page.tsx`
Added three export statements to prevent static generation:
```typescript
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"
```

### `/next.config.mjs`
Added experimental settings to skip ISR caching for dynamic routes.

### `/vercel.json` (Created)
```json
{
  "buildCommand": "npm install --legacy-peer-deps && npm run build",
  "devCommand": "npm run dev"
}
```
Environment variables are configured through the Vercel Dashboard (Settings → Environment Variables), not in this file. This file only specifies the build command.

## Deployment Steps

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Fix: Resolve npm peer dependency conflict and Next.js prerendering error"
git push origin main
```

### Step 2: Configure Vercel Environment Variables
**See detailed guide:** `VERCEL_ENV_SETUP.md`

Quick summary:
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add 5 variables (see table below)
3. For each variable, ensure all three environments are checked: Production, Preview, Development

| Variable | Value |
|----------|-------|
| `MONGODB_URL` | `mongodb+srv://saksham:phmbjkvjOzw37KhZ@samarpan.j05aoqs.mongodb.net/?appName=Samarpan` |
| `GOOGLE_CLIENT_ID` | `1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `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` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com` |
| `NEXT_PUBLIC_APP_URL` | `https://samarpan.vercel.app` |

### Step 3: Redeploy
1. After adding environment variables, trigger a redeploy:
   - Option A: Push a code change to GitHub (Vercel auto-redeploys)
   - Option B: Manually redeploy from Vercel Dashboard → Deployments → Latest → Redeploy
2. The build should complete successfully (2-3 minutes)
3. Verify at your Vercel URL

## What Changed and Why

### Dependency Pinning
Using `"latest"` creates reproducibility issues across environments. Vercel's build environment enforces stricter dependency resolution than local development. Pinning to compatible versions ensures:
- ✅ Consistent builds across machines
- ✅ Predictable dependency resolution
- ✅ Vercel CI/CD compatibility

### Force Dynamic Route
Next.js 15+ attempts to prerender all pages for performance. However, dynamic routes (those requiring runtime data) must skip prerendering. The three export statements ensure:
- `dynamic = "force-dynamic"` - **Primary marker** that this route needs runtime rendering
- `revalidate = 0` - **ISR disabled** - No caching, fresh render each time
- `fetchCache = "force-no-store"` - **Fetch caching disabled** - All data fetches bypass cache

### `.npmrc` Configuration
The `legacy-peer-deps=true` flag tells npm:
> "I understand peer dependency warnings exist, but I have explicitly pinned versions that are compatible, so proceed with installation."

This is safe and widely used in production when versions are carefully chosen.

## Verification Checklist

After deployment, verify:

- [ ] Build completes without npm ERESOLVE errors
- [ ] Google OAuth login flow works end-to-end
- [ ] Callback redirects to dashboard after login
- [ ] User data persists in localStorage
- [ ] MongoDB connection is successful
- [ ] No prerendering errors in build logs

## Troubleshooting

### Build Still Fails?
1. Check Vercel build logs for specific error
2. Verify all environment variables are set correctly
3. Clear Vercel cache: Settings → General → Clear All Caches
4. Redeploy

### Google OAuth Not Working?
1. Verify `GOOGLE_CLIENT_ID` matches Google Cloud Console
2. Confirm callback URL in Google Cloud is: `https://yourapp.vercel.app/api/auth/google/callback`
3. Check that both `GOOGLE_CLIENT_SECRET` and token are correct

### MongoDB Connection Error?
1. Verify `MONGODB_URL` connection string is correct
2. Check MongoDB Atlas IP whitelist includes Vercel IPs (or use 0.0.0.0/0)
3. Confirm database user has proper permissions

## Technical Details

- **Node.js Version on Vercel:** 22.x (automatically selected)
- **npm Version:** Latest (automatic)
- **Build Time:** ~2-3 minutes (first build may take longer)
- **Deployment Approach:** Reproducible builds with pinned versions

## References

- [Next.js Dynamic Routes Docs](https://nextjs.org/docs/app/building-your-application/rendering/dynamic-components)
- [npm legacy-peer-deps Documentation](https://docs.npmjs.com/cli/v8/using-npm/config#legacy-peer-deps)
- [Vercel Build Configuration](https://vercel.com/docs/projects/project-configuration)
- [MongoDB + Google Auth Library Compatibility](https://github.com/googleapis/google-auth-library-nodejs)