# Repository Configuration

## Project Type
- **Framework**: Next.js (16.0.0)
- **Language**: TypeScript
- **Runtime**: Node.js

## Testing Framework
- **targetFramework**: Playwright

## Project Structure
```
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   └── auth/             # Authentication endpoints
│   ├── (public)/             # Public routes
│   └── admin/                # Admin dashboard routes
├── components/               # React components
│   ├── ui/                   # UI library components
│   └── [feature].tsx         # Feature components
├── lib/                      # Utilities and helpers
│   ├── auth.ts               # Authentication utilities
│   ├── email.ts              # Email service
│   ├── mongodb.ts            # Database connection
│   └── [utility].ts          # Other utilities
├── hooks/                    # Custom React hooks
├── styles/                   # Global styles
├── public/                   # Static assets
└── scripts/                  # Setup scripts

```

## Key Technologies
- **UI Components**: Radix UI, Shadcn UI
- **Styling**: Tailwind CSS
- **Database**: MongoDB
- **Authentication**: JWT + NextAuth integration
- **Email**: Nodemailer with SendGrid SMTP
- **State Management**: Redux Toolkit
- **Forms**: React Hook Form + Zod
- **Toast Notifications**: Sonner

## Environment Variables (Production Critical)
- `MONGODB_URL`: MongoDB connection string (required)
- `NEXT_PUBLIC_APP_URL`: Application URL (required for password reset emails)
- `JWT_SECRET`: JWT signing secret (required)
- `SMTP_HOST`: Email provider SMTP host (SendGrid)
- `SMTP_PORT`: SMTP port (default: 587)
- `SMTP_USER`: SMTP username (apikey)
- `SMTP_PASS`: SMTP password (SendGrid API key)
- `SMTP_FROM`: Sender email address
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Public Google OAuth client ID

## Build & Deployment
```bash
npm run build      # Build production bundle
npm start          # Start production server
npm run dev        # Start development server
npm run lint       # Run ESLint
```

## Authentication Features
- Email/Password signup & login
- Google OAuth integration
- Password reset (token-based, 1-hour expiry)
- JWT token management

## Recent Updates (Password Reset Component - Production Ready)
- ✅ HTML escaping in email templates to prevent injection
- ✅ Email format validation on client and server
- ✅ Enhanced password strength requirements (8+ chars, uppercase, lowercase, numbers)
- ✅ Network timeout handling (30 seconds) with AbortController
- ✅ App URL detection with fallback chain (env → headers → origin)
- ✅ Security best practices (don't reveal account existence)
- ✅ Comprehensive error handling without exposing internals
- ✅ Request validation on both client and server
- ✅ Database operation verification

## Notes for Deployment
1. Set `NEXT_PUBLIC_APP_URL` environment variable in production
2. Configure SendGrid credentials in SMTP environment variables
3. Ensure MongoDB connection is stable and secure
4. Test password reset flow end-to-end in staging before production
5. Monitor server logs for authentication-related errors