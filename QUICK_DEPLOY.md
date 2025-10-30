# Quick Deployment Guide (5 Minutes)

> **Error Fixed:** The previous `vercel.json` was causing the "references Secret" error. It's now simplified. Follow these steps for a clean deployment.

## Files Changed
✅ `/package.json` - Pinned dependency versions
✅ `/.npmrc` - Added npm configuration  
✅ `/vercel.json` - Created Vercel build config
✅ `/next.config.mjs` - Updated Next.js config
✅ `/app/(public)/auth/google-callback-handler/page.tsx` - Added dynamic route markers

## Next Steps

### 1. Verify Locally (Optional)
```bash
npm install
npm run build
npm run dev
```

### 2. Push to GitHub
```bash
git add .
git commit -m "Fix: Resolve npm peer dependency and prerendering errors"
git push origin main
```

### 3. Set Vercel Environment Variables

**📚 Detailed Step-by-Step Guide:** See `VERCEL_ENV_SETUP.md` for complete instructions with screenshots guidance.

**Quick Summary:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable below
3. ✅ Check all three environments: Production, Preview, Development

| Name | Value |
|------|-------|
| MONGODB_URL | `mongodb+srv://saksham:phmbjkvjOzw37KhZ@samarpan.j05aoqs.mongodb.net/?appName=Samarpan` |
| GOOGLE_CLIENT_ID | `1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com` |
| GOOGLE_CLIENT_SECRET | `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` |
| NEXT_PUBLIC_GOOGLE_CLIENT_ID | `1000323711355-g1dkc8ktb0mqecst47m65v9upkus4f6c.apps.googleusercontent.com` |
| NEXT_PUBLIC_APP_URL | `https://samarpan.vercel.app` |

### 4. Redeploy
- Vercel auto-redeploys on GitHub push
- **Expected build time:** 2-3 minutes
- Watch logs for success

## What Was Fixed

| Issue | Cause | Fix |
|-------|-------|-----|
| **npm ERESOLVE error** | Conflicting gcp-metadata versions | Pinned `gcp-metadata@^8.1.0` and `mongodb@^6.20.0` |
| **Prerendering error** | Static generation of dynamic route | Added `dynamic = "force-dynamic"` |
| **Build failure** | No npm legacy-peer-deps handling | Created `.npmrc` with `legacy-peer-deps=true` |

## Verify It Works

After deployment:
1. ✅ Visit your Vercel URL
2. ✅ Click "Sign in with Google"  
3. ✅ Verify redirect to dashboard
4. ✅ Check user data in profile

**Need details?** See `DEPLOYMENT_FIX.md`