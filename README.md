# Samarpan - Blood Donor Connection Platform

<div align="center">

![Samarpan Logo](public/placeholder-logo.svg)

**Connect Donors, Save Lives** – A real-time blood and platelet donor connection platform that brings donors and patients together.

[![Next.js](https://img.shields.io/badge/Next.js-16.0.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.20.0-13AA52?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

[Live Demo](#) • [Report Bug](../../issues) • [Request Feature](../../issues)

</div>

---

## 🎯 About Samarpan

Samarpan is a comprehensive blood donation management platform designed to connect donors with patients in need of blood and platelets. Built with modern web technologies, it enables real-time connections, efficient donor management, and streamlined administrative operations.

### Key Features

#### 👥 Donor & Patient Features
- **Real-Time Connections** – Instantly connect blood donors with patients in need
- **User Authentication** – Secure signup, login, and password management
- **Donation Tracking** – Track your blood donation history and earn certificates
- **Request Management** – Create and manage blood requests with priority levels
- **Event Participation** – Join upcoming blood donation events in your area
- **Notifications** – Real-time alerts for matching blood requests
- **User Dashboard** – Comprehensive profile and activity management
- **Certificate Generation** – Automatic certificate creation for donors

#### 🛡️ Admin Features
- **Admin Panel** – Centralized dashboard for system management
- **User Management** – View and manage all registered users
- **Donation Management** – Track and verify all donations
- **Request Management** – Review and approve blood requests
- **Event Management** – Create and manage blood donation events
- **Transportation Coordination** – Manage transportation logistics
- **Notification System** – Send bulk notifications to users
- **Image Management** – View and manage donation images
- **Contact Submissions** – Review and respond to user inquiries
- **Certificate Management** – Generate and track donor certificates

---

## 👥 NGO Staff Guide

### Getting Started as NGO Staff

1. **Access the Admin Panel**
   - Visit `/admin/login` in your browser
   - Use the default credentials:
     - Email: `admin@samarpan.com`
     - Password: `admin@123`
   - Change your password immediately after first login

2. **Understanding the Dashboard**
   - **User Management**: View and manage all registered donors
   - **Event Management**: Create and manage blood donation events
   - **Donation Tracking**: Monitor donation activities and certificates
   - **Notifications**: Send bulk notifications to users

### Key Operations for NGO Staff

#### Managing Events
- **Create Events**: Go to Admin Dashboard → Events → Create New Event
- **Set Event Details**: Title, date, location, volunteer slots needed
- **Monitor Registrations**: View donor registrations and QR codes
- **Track Donations**: Update donation status and blood test results

#### Managing Donors
- **View Donor List**: Admin Dashboard → Users → View all registered users
- **Event Donors**: Events → Select Event → View Registered Donors
- **Update Blood Types**: After blood testing, update donor blood types
- **Generate Certificates**: Automatically generate donation certificates

#### Blood Donation Process
1. **Event Creation**: Create event with date, time slots, and location
2. **Donor Registration**: Donors register through the public portal
3. **Check-in Process**: Use QR codes to verify donor arrival
4. **Blood Testing**: Update blood types after lab results
5. **Certificate Generation**: Generate certificates for completed donations

#### Important Settings
- **Environment Variables**: Ensure all required environment variables are set
- **Email Configuration**: Set up email service for notifications
- **Database Backup**: Regular backups of MongoDB data
- **Admin Permissions**: Assign appropriate permissions to staff members

### Troubleshooting
- **Can't access admin panel**: Check login credentials and permissions
- **Events not showing**: Verify event dates and status
- **QR codes not working**: Ensure QR tokens are generated for registrations
- **Email notifications failing**: Check email service configuration

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16 with App Router
- **UI Library:** React 19
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + Radix UI components
- **State Management:** Redux Toolkit
- **Form Handling:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Icons:** Lucide React
- **PDF Generation:** PDFKit & PDF-Lib

### Backend
- **Runtime:** Node.js (Next.js Server)
- **Database:** MongoDB 6.20
- **Authentication:** JWT + bcryptjs
- **Email:** Nodemailer
- **Cloud Storage:** AWS S3 (via AWS SDK)
- **PDF Processing:** PDFKit

### Development
- **Package Manager:** npm/pnpm
- **Build Tool:** Next.js (Turbopack)
- **Linting:** ESLint
- **Environment:** Node.js 18+

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- MongoDB instance (local or Atlas)
- AWS S3 credentials (optional, for file uploads)
- Email service credentials (SendGrid or similar via Nodemailer)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/samarpan.git
   cd samarpan
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with:
   ```env
   # Database
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/samarpan

   # JWT
   JWT_SECRET=your-secret-key-here

   # Email Service
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password

   # AWS (optional)
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_S3_BUCKET=your-bucket-name
   AWS_REGION=us-east-1

   # Google OAuth (optional)
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
   ```

4. **Set up the database and create super admin:**
   ```bash
   npm run setup:admin
   ```
   
   This initializes the admin system with database indexes and creates the super admin account.
   
   > 📌 For detailed admin setup instructions, see [Admin Quick Start Guide](./ADMIN_QUICKSTART.md)

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:3000`

### Admin System

#### Default Super Admin Credentials

Login at `/admin/login`:
- **Email:** `admin@samarpan.com`
- **Password:** `admin@123`

#### Setup Commands

```bash
npm run setup:admin      # Recommended: Sets up everything with indexes
npm run create-admin     # Interactive: Create super admin or regular admin
npx tsx create-admin.ts  # Direct: Create/update super admin
```

#### Admin Features

✅ Create and manage admin accounts with specific features/permissions  
✅ Two-tier system: Super Admin (full access) and Regular Admin (limited)  
✅ Granular permission control (16+ different permissions)  
✅ Real-time admin dashboard with activity tracking  

For complete documentation, see:
- 📖 [Admin Quick Start Guide](./ADMIN_QUICKSTART.md)
- 📚 [Admin Creation Guide](./docs/ADMIN_CREATION_GUIDE.md)
- 🔧 [Admin System Documentation](./docs/ADMIN_SYSTEM.md)

---

## 📁 Project Structure

```
samarpan/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public routes
│   │   ├── page.tsx              # Home page
│   │   ├── auth/                 # Auth routes (login, signup)
│   │   ├── dashboard/            # User dashboard
│   │   ├── donate-blood/         # Blood donation requests
│   │   ├── request-blood/        # Blood request creation
│   │   ├── events/               # Event listings
│   │   ├── notifications/        # Notification center
│   │   └── ...
│   ├── admin/                    # Admin routes
│   │   ├── login/                # Admin login
│   │   ├── page.tsx              # Admin dashboard
│   │   └── ...
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── admin/                # Admin operations
│   │   ├── blood-request/        # Blood requests API
│   │   ├── donation-requests/    # Donations API
│   │   ├── users/                # User management API
│   │   ├── events/               # Events API
│   │   ├── notifications/        # Notifications API
│   │   └── ...
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Radix UI components
│   ├── admin-*.tsx               # Admin panel components
│   ├── blood-*.tsx               # Blood-related components
│   ├── login-form.tsx            # Auth forms
│   └── ...
├── lib/                          # Utility functions
│   ├── auth.ts                   # Authentication utilities
│   ├── mongodb.ts                # Database connection
│   ├── email.ts                  # Email service
│   ├── store.ts                  # Redux store
│   ├── slices/                   # Redux slices
│   └── utils.ts                  # Helper utilities
├── hooks/                        # Custom React hooks
│   ├── use-geolocation.ts        # Geolocation hook
│   ├── use-mobile.ts             # Mobile detection
│   └── use-toast.ts              # Toast notifications
├── public/                       # Static assets
├── scripts/                      # Utility scripts
│   ├── create-admin.ts           # Admin creation script
│   └── update-admin-password.ts  # Password update script
├── styles/                       # CSS files
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── next.config.mjs               # Next.js config
├── tailwind.config.ts            # Tailwind CSS config
└── middleware.ts                 # Next.js middleware
```

---

## 📚 API Documentation

### Authentication Endpoints

**POST** `/api/auth/signup` – Register new user
```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "John Doe",
  "phone": "+91XXXXXXXXXX",
  "bloodType": "O+"
}
```

**POST** `/api/auth/login` – User login
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**POST** `/api/auth/admin-login` – Admin login
```json
{
  "email": "admin@samarpan.com",
  "password": "admin-password"
}
```

### Blood Request Endpoints

**GET** `/api/blood-request` – Get all blood requests  
**POST** `/api/blood-request` – Create new blood request  
**PUT** `/api/blood-request/[id]` – Update blood request  
**DELETE** `/api/blood-request/[id]` – Delete blood request

### User Endpoints

**GET** `/api/users` – Get all users (admin only)  
**GET** `/api/users/[id]` – Get user profile  
**PUT** `/api/users/[id]` – Update user profile  

### Event Endpoints

**GET** `/api/events` – Get all events  
**POST** `/api/events` – Create event (admin only)  
**PUT** `/api/events/[id]` – Update event (admin only)  
**DELETE** `/api/events/[id]` – Delete event (admin only)

---

## 🔐 Authentication & Security

- **Password Hashing:** bcryptjs with salt rounds = 10
- **JWT Tokens:** Secure token-based authentication
- **Protected Routes:** Middleware-based route protection
- **Environment Variables:** Sensitive data stored in `.env.local`
- **HTTPS Ready:** Production-ready for HTTPS deployment
- **CORS:** Properly configured cross-origin policies

---

## 🧪 Development & Build

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Create/Update admin account
npm run create-admin

# Initialize database
npm run db:init

# Full setup (install + create admin)
npm run setup
```

### Environment-Specific Builds

The application uses environment-specific configurations:
- **Development:** `npm run dev` – Hot reload enabled
- **Production:** `npm run build && npm start` – Optimized build

---

## 📝 Environment Variables

Create a `.env.local` file in the project root:

```env
# MongoDB Connection
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/samarpan

# JWT Configuration
JWT_SECRET=your-secret-key-min-32-characters

# Email Service
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@samarpan.com

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=XXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXX
AWS_S3_BUCKET=samarpan-uploads
AWS_REGION=us-east-1

# Google OAuth (Optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Admin Credentials (for initialization)
ADMIN_EMAIL=admin@samarpan.com
ADMIN_PASSWORD=strong-password
```

---

## 🎨 Customization

### Styling

The project uses Tailwind CSS with a custom theme. Modify theme colors in `tailwind.config.ts`:

```typescript
theme: {
  colors: {
    primary: '#your-color',
    secondary: '#your-color',
    // ... other colors
  }
}
```

### UI Components

All UI components are in `components/ui/` and based on Radix UI. Customize them as needed:

```typescript
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push your repository to GitHub
2. Connect to Vercel: https://vercel.com/new
3. Set environment variables in Vercel dashboard:
   - **CRITICAL FOR PASSWORD RESET:** Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g., `https://yourdomain.com`)
     - Without this, password reset links will not work correctly
     - If not set, the app will try to auto-detect using `VERCEL_URL`, but explicitly setting it is recommended
   - Include all other required variables: `MONGODB_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SMTP_*` settings
4. Deploy!

**⚠️ Password Reset Configuration:**
Password reset emails contain a link to `/reset-password`. This URL must be accessible from the internet. The app constructs it using:
- Priority 1: `NEXT_PUBLIC_APP_URL` environment variable
- Priority 2: Vercel's automatic `VERCEL_URL` (if not set in Priority 1)
- Priority 3: Request headers (x-forwarded-proto, x-forwarded-host)
- Priority 4: Request origin

To ensure password reset works on production:
```
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Traditional Server

```bash
npm install --production
npm run build
npm start
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Standards

- Follow ESLint rules
- Use TypeScript for type safety
- Add comments for complex logic
- Test new features thoroughly
- Keep components focused and reusable

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Radix UI** – For excellent accessible components
- **Next.js** – For the amazing React framework
- **MongoDB** – For robust database solutions
- **Tailwind CSS** – For utility-first CSS framework
- **The Open Source Community** – For invaluable libraries and tools

---

## 📞 Support

For support, email support@samarpan.com or open an issue in the repository.

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] AI-powered donor matching
- [ ] SMS notifications
- [ ] WhatsApp integration
- [ ] Multi-language support
- [ ] Blood bank inventory management
- [ ] Plasma donation support

---

<div align="center">

**Made with ❤️ to save lives**

[⬆ Back to Top](#samarpan---blood-donor-connection-platform)

</div>
