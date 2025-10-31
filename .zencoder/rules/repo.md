# Samarpan Repository Information

## Project Overview
Samarpan is a Next.js-based blood donor platform that connects donors and patients to save lives.

## Tech Stack
- **Framework**: Next.js 16.0.0
- **UI Framework**: React 19.2.0
- **Database**: MongoDB 6.20.0
- **State Management**: Redux with Redux Toolkit
- **UI Components**: Radix UI with shadcn/ui
- **Styling**: Tailwind CSS 4.1.9
- **Notifications**: Sonner 1.7.4
- **Testing Framework**: No test framework currently configured
- **Target Framework for Tests**: Playwright (recommended for E2E testing)

## Directory Structure
```
├── app/                    # Next.js app directory
│   ├── (public)/          # Public routes
│   ├── admin/             # Admin routes
│   └── api/               # API routes
├── components/            # React components
│   └── ui/               # UI component library
├── lib/                   # Utility functions
│   ├── slices/           # Redux slices
│   └── mongodb.ts        # Database connection
├── hooks/                # Custom React hooks
├── public/               # Static assets
└── scripts/              # Utility scripts
```

## Key Features
- User authentication (email/password and Google OAuth)
- Blood donation management
- Blood request system
- Admin dashboard
- Notifications system
- Transportation request handling
- Certificate generation

## Environment Variables
- `NEXT_PUBLIC_APP_URL`: Application URL for password reset links
- Database and email configuration in `.env.local`

## Current Issues to Address
- Sonner Toaster not rendering in layout
- Password reset success feedback needs improvement