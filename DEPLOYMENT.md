# Deployment Guide - Samarpan

This guide provides step-by-step instructions for deploying Samarpan to production, with special attention to email configuration and password reset functionality.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Vercel Deployment](#vercel-deployment)
3. [Environment Variables](#environment-variables)
4. [Email Configuration](#email-configuration)
5. [Database Setup](#database-setup)
6. [Testing After Deployment](#testing-after-deployment)
7. [Common Issues](#common-issues)

---

## Pre-Deployment Checklist

Before deploying, ensure:

- ✅ All code is committed to your Git repository
- ✅ `.env.local` is in `.gitignore` (never commit secrets)
- ✅ Build passes locally: `npm run build`
- ✅ Tests pass (if applicable)
- ✅ MongoDB Atlas cluster is created and accessible
- ✅ SendGrid account and API key obtained
- ✅ Custom domain configured (optional but recommended)

---

## Vercel Deployment

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for production"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select your repository
5. Vercel auto-detects Next.js, click "Deploy"

### Step 3: Set Environment Variables (Critical)

In Vercel Dashboard:

1. Go to **Settings → Environment Variables**
2. Add all required variables (see section below)
3. Re-deploy after adding variables

---

## Environment Variables

### Production Environment Variables

Set these in your deployment platform (Vercel, Heroku, etc.):

```env
# === CRITICAL FOR PRODUCTION ===
# Set this to your deployed domain
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# === Database ===
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/samarpan?retryWrites=true&w=majority

# === JWT Secret (use a strong, random string) ===
JWT_SECRET=your-very-secure-random-string-at-least-32-characters-long

# === Email (SendGrid) ===
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.YOUR_SENDGRID_API_KEY_HERE
SMTP_FROM="Samarpan <noreply@yourdomain.com>"

# === Google OAuth (if using) ===
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# === AWS S3 (if using file uploads) ===
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# === Environment ===
NODE_ENV=production
```

### ⚠️ IMPORTANT: NEXT_PUBLIC_APP_URL

**This is the most common cause of email issues after deployment!**

```env
# In development:
NEXT_PUBLIC_APP_URL=http://localhost:3000

# In production (change yourdomain.com to your actual domain):
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

This variable is used to generate password reset links in emails. If not set correctly:
- ❌ Users receive reset links with wrong domain
- ❌ Clicking reset link goes to wrong URL
- ❌ Password reset fails

---

## Email Configuration

### Using SendGrid (Recommended)

#### 1. Create SendGrid Account

1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for a free account
3. Verify your email

#### 2. Get API Key

1. Go to **Settings → API Keys**
2. Create new API key with "Full Access"
3. Copy the key (you won't see it again)

#### 3. Verify Sender Email

1. Go to **Sender Authentication**
2. Choose "Domain Authentication" or "Single Sender Verification"
3. Follow verification steps
4. Use verified email in `SMTP_FROM`

#### 4. Set Environment Variables

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.YOUR_FULL_API_KEY_HERE
SMTP_FROM="Samarpan <noreply@yourdomain.com>"
```

### Verifying Email Works

After deployment, test the forgot password flow:

1. Go to `/login`
2. Click "Forgot Password"
3. Enter your email
4. Check inbox (and spam folder)
5. Click reset link
6. Set new password

---

## Database Setup

### MongoDB Atlas (Cloud)

#### 1. Create Cluster

1. Go to [mongodb.com/cloud](https://mongodb.com/cloud)
2. Create free account
3. Create a new cluster (M0 free tier)
4. Wait for cluster to be created (~5-10 minutes)

#### 2. Get Connection String

1. Click "Connect"
2. Select "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password
5. Replace `<database>` with database name

#### 3. Create Admin User

After deploying, create the admin user:

```bash
# If deployed on Vercel, run this locally:
# First, make sure .env.local is set with production MONGODB_URL

npm run create-admin
# or
npm run db:init
```

---

## Testing After Deployment

### 1. Smoke Tests

- [ ] Landing page loads
- [ ] Sign up works
- [ ] Login works
- [ ] Logout works

### 2. Email Tests

- [ ] Forgot password email is received
- [ ] Email has correct reset link URL (check domain)
- [ ] Reset link works and redirects correctly
- [ ] Password actually changes after reset

### 3. Database Tests

- [ ] User data is saved correctly
- [ ] Blood requests are created
- [ ] Admin dashboard loads

### 4. Admin Panel Tests

- [ ] Admin login works
- [ ] Admin can view users
- [ ] Admin can manage blood requests

### Email Debugging

If emails aren't received:

1. **Check SMTP credentials** - SendGrid API key correct?
2. **Check email sender** - Is `SMTP_FROM` a verified email?
3. **Check spam folder** - Sometimes emails land there
4. **Check SendGrid logs** - Go to **Logs** in SendGrid dashboard
5. **Check server logs** - Look for email sending errors

---

## Common Issues

### Issue: Password reset link has wrong domain

**Cause:** `NEXT_PUBLIC_APP_URL` not set in production

**Solution:**
```env
# Set to your actual deployed domain
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Issue: Reset email never arrives

**Possible causes:**
1. `SMTP_PASS` (SendGrid API key) is incorrect
2. `SMTP_FROM` email is not verified in SendGrid
3. Email is in spam folder
4. SendGrid free tier has daily limits (100 emails/day)

**Solution:**
- Verify SendGrid credentials
- Check SendGrid dashboard → Logs
- Verify sender email in SendGrid
- Upgrade SendGrid plan if limit reached

### Issue: Reset link expires too quickly

**Cause:** Token expiry set to too short a duration

**Solution:** Check `forgot-password/route.ts` line 40:
```typescript
const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
```

Adjust the `60 * 60 * 1000` (milliseconds) to change expiry time.

### Issue: Deployment fails with TypeScript errors

**Solution:**
```bash
# Check local build first
npm run build

# Fix any errors, then re-deploy
git push origin main
```

### Issue: Database connection timeout

**Causes:**
- Wrong connection string
- IP not whitelisted in MongoDB Atlas
- Database credentials wrong

**Solution:**
1. Check connection string format
2. In MongoDB Atlas, add your deployment provider's IP to whitelist
3. For Vercel, add `.vercel.app` domain to whitelist

---

## Performance Optimization

### Caching

The application uses Next.js caching:

- Static pages are cached at edge
- Database queries are optimized
- Images are optimized automatically

### Monitoring

Set up monitoring in Vercel:

1. Vercel Dashboard → Analytics
2. Monitor:
   - Page load times
   - Core Web Vitals
   - Error rates
   - API response times

---

## Security Checklist

- ✅ Never commit `.env.local`
- ✅ Use strong `JWT_SECRET` (32+ characters)
- ✅ Keep SendGrid API key private
- ✅ Enable MongoDB IP whitelist
- ✅ Use HTTPS only (Vercel handles this)
- ✅ Set secure passwords for all accounts
- ✅ Enable 2FA on SendGrid and MongoDB
- ✅ Rotate API keys regularly

---

## Rollback Instructions

If deployment has issues:

1. **Vercel Dashboard → Deployments**
2. Find the previous working deployment
3. Click the three dots → **Promote to Production**
4. Previous version is now live

---

## Support & Resources

- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas:** https://docs.atlas.mongodb.com
- **SendGrid Docs:** https://docs.sendgrid.com

---

## Quick Deployment Checklist

```bash
# 1. Set environment variables in your deployment platform
# 2. Push code to GitHub
git add .
git commit -m "Production deployment"
git push origin main

# 3. Vercel auto-deploys
# 4. Monitor deployment logs
# 5. Test all features after deployment

# 6. Create admin user (run locally):
# - Update .env.local with production MONGODB_URL
npm run create-admin

# 7. Test forgot password flow
# 8. Monitor email delivery in SendGrid dashboard
```

---

**Last Updated:** October 2024  
**Version:** 1.0.0