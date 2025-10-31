# Email Features Usage & Token Authorization

## Overview

The Samarpan blood donation platform uses **SendGrid** for email delivery. All email notifications (contact form replies, admin alerts, user notifications) are sent via SendGrid SMTP authentication using an API key token.

## Token Authorization Setup

### 1. SendGrid API Key Generation

**How to create a SendGrid API Key:**

1. Log in to [SendGrid Dashboard](https://app.sendgrid.com/)
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Choose key type: **Full Access** (for development) or **Restricted Access** (for production)
5. Name the key: e.g., `Samarpan-Email-Prod-2025`
6. Copy the generated API key (you will only see it once)

### 2. Environment Variable Configuration

The API key is configured as `SMTP_PASS` in environment variables with a special prefix:

```env
# .env.local or Vercel Environment Variables

# SendGrid SMTP Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.<your-api-key-here>
SMTP_FROM="Your App Name <noreply@yourdomain.com>"
```

**Important:** The `SMTP_USER` must always be `apikey` (literal string). The token goes in `SMTP_PASS`.

### 3. Security Best Practices for Token Management

#### ✅ DO:
- Store the API key **ONLY** in environment variables (`.env.local` for development, Vercel dashboard for production)
- Use **restricted access API keys** in production (limit to Mail Send only)
- Rotate API keys every 90 days
- Use different keys for development and production environments
- Enable IP whitelisting on SendGrid for your server IPs

#### ❌ DON'T:
- Commit API keys to Git/GitHub (`.env.local` is in `.gitignore`)
- Share API keys in Slack, email, or documentation
- Use the same key across multiple environments
- Expose the key in client-side code (it's server-only in `lib/email.ts`)

---

## Email Features in Samarpan

### 1. Contact Form Submission Notifications

**When triggered:** User submits contact form via `/contact` page

**What happens:**
- Submission data stored in MongoDB `contactSubmissions` collection
- Admin receives immediate email notification with:
  - Submitter name, email, phone
  - Subject and message content
  - Link to admin dashboard to view/reply

**API Endpoint:** `POST /api/contact-submissions`

### 2. Admin Reply to Contact Submissions

**When triggered:** Admin composes and sends reply via admin dashboard

**What happens:**
- Reply text saved to database with timestamp
- Submission status updated from "new" → "replied"
- User receives professional HTML-formatted email with:
  - Admin's reply message
  - Instructions on next steps
  - Contact information (if applicable)

**API Endpoint:** `POST /api/contact-submissions/reply`

### 3. Email Implementation File

Location: `lib/email.ts`

Key functions:
```typescript
// Send email using SendGrid SMTP
async function sendEmail({
  to: string,           // Recipient email
  subject: string,      // Email subject
  html: string,         // HTML email body
  text?: string,        // Fallback text
  from?: string         // Override sender (defaults to SMTP_FROM)
}): Promise<boolean>
```

---

## Testing Email Features Locally

### 1. Using Mailtrap (Sandbox Testing)

**Setup for development/testing without sending real emails:**

1. Create free account at [Mailtrap.io](https://mailtrap.io/)
2. Get SMTP credentials from Mailtrap dashboard
3. Update `.env.local`:
   ```env
   SMTP_HOST=live.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=<mailtrap-user>
   SMTP_PASS=<mailtrap-password>
   ```
4. All emails will be captured in Mailtrap inbox instead of sending to real addresses

### 2. SendGrid Sandbox Mode

**For testing with SendGrid without charges:**

1. In SendGrid dashboard, create an API key with **limited scope** (Mail Send only)
2. Use this key only in development environment
3. All emails will queue but won't be delivered (helpful for testing)

### 3. Testing Locally with npm run dev

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Test contact form submission
curl -X POST http://localhost:3000/api/contact-submissions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+91 9876543210",
    "subject": "Test Subject",
    "message": "Test message body"
  }'

# Check Mailtrap inbox for received email
```

---

## Token Rotation & Maintenance

### Monthly Checklist:
- [ ] Verify SendGrid dashboard is accessible
- [ ] Check email delivery stats (no bounces/complaints)
- [ ] Review API key usage and permissions
- [ ] Test a sample email submission

### Every 90 Days:
- [ ] Generate new API key in SendGrid
- [ ] Update `.env.local` with new key
- [ ] Update Vercel environment variable with new key
- [ ] Revoke old API key in SendGrid
- [ ] Test email delivery after rotation

### If Token Compromised:
1. Go to SendGrid dashboard → Settings → API Keys
2. **Immediately revoke** the compromised key
3. Generate new API key
4. Update environment variable
5. Redeploy application
6. Verify email delivery works

---

## Vercel Deployment Email Configuration

When deploying to Vercel, add these environment variables:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add the following (ensure all environments are checked: Production, Preview, Development):

| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.sendgrid.net` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `apikey` |
| `SMTP_PASS` | `SG.<your-api-key>` |
| `SMTP_FROM` | `"Samarpan <noreply@samarpan.com>"` |

3. **Redeploy** after adding variables
4. Test email delivery on production URL

---

## Troubleshooting Email Issues

### Problem: "Failed to send email"
**Solution:** 
- Check SMTP credentials are correct in env variables
- Verify SMTP_HOST and SMTP_PORT are exact
- Ensure API key hasn't expired or been revoked
- Check SendGrid account doesn't have payment issues

### Problem: "Email received but looks broken/plain text"
**Solution:**
- Verify HTML email template is valid
- Check for missing closing tags in email templates
- Test in multiple email clients (Gmail, Outlook, etc.)

### Problem: "Emails going to spam folder"
**Solution:**
- Add SPF and DKIM records for your domain in SendGrid
- Configure reply-to address
- Use branded sender email (not generic)
- Monitor SendGrid bounce/complaint rates

### Problem: "Token shows as invalid"
**Solution:**
- Copy/paste exact token without spaces
- Ensure token starts with `SG.` prefix
- Verify token hasn't been revoked in SendGrid dashboard
- Try generating a new API key

---

## Email Delivery Logs

### Monitor Email Delivery Status:
1. Go to SendGrid Dashboard → **Activity Feed**
2. View delivered/bounced/failed emails
3. Check bounce reasons and unsubscribe requests
4. Download delivery reports for compliance

### In Application:
- All email attempts are logged in console (dev)
- Check application error logs on Vercel
- Review API responses for success/failure status

---

## API Reference

### POST /api/contact-submissions
Submits contact form and sends admin notification email.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 9876543210",
  "subject": "Inquiry",
  "message": "Message content"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Submission received",
  "submissionId": "65f3b4a1c2d3e4f5g6h7i8j9"
}
```

### POST /api/contact-submissions/reply
Sends reply email to user and updates submission status.

**Request:**
```json
{
  "submissionId": "65f3b4a1c2d3e4f5g6h7i8j9",
  "adminReply": "Thank you for contacting us. Here's our response..."
}
```

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Reply sent successfully",
  "status": "replied"
}
```

---

## Related Documentation

- [SendGrid SMTP Documentation](https://docs.sendgrid.com/for-developers/sending-email/smtp-service)
- [SendGrid API Key Management](https://docs.sendgrid.com/ui/account-and-settings/api-keys)
- [Email Configuration Guide](./SMTP_SETUP_GUIDE.md)
- [Vercel Deployment Setup](./VERCEL_ENV_SETUP.md)

---

**Last Updated:** January 2025
**Maintained by:** Samarpan Development Team