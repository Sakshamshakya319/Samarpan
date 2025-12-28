# 📘 Samarpan – Learning Guide (`learn.md`)

This document is a **conceptual and practical learning guide** for the Samarpan Blood Donor Connection Platform.  
It explains *how the system works*, *why decisions were made*, and *how to get productive quickly* as a developer or NGO staff member.

---

## 1️⃣ What is Samarpan?

**Samarpan** is a real-time blood and platelet donor connection platform that connects:
- **Donors**
- **Patients**
- **NGOs / Admin staff**

The goal is to **reduce response time during emergencies** and **digitize blood donation workflows** such as events, certificates, and notifications.

---

## 2️⃣ Who Is This Guide For?

This guide is useful if you are:

- 👨‍💻 A **developer** joining the project
- 🏥 **NGO staff** managing donors and events
- 🤝 A **contributor** exploring the codebase
- 🚀 A **deployer** preparing production setup

---

## 3️⃣ High-Level System Architecture

### Frontend
- Built with **Next.js App Router**
- Uses **React + TypeScript**
- Styled with **Tailwind CSS + Radix UI**
- State handled by **Redux Toolkit**

### Backend
- Runs inside **Next.js API routes**
- Uses **MongoDB** for data storage
- **JWT-based authentication**
- Email + WhatsApp notifications

### Key Idea
> One unified Next.js app handling **UI, API, auth, and admin panel**.

---

## 4️⃣ Core Concepts You Should Understand

### 🔐 Authentication & Roles

There are **two major user types**:

#### 1. Public Users
- Donors
- Patients
- Event participants

They can:
- Sign up & log in
- Request blood
- Register for events
- Receive notifications
- Download certificates

#### 2. Admin / NGO Staff
- Super Admin
- Regular Admin (permission-based)

They can:
- Create & manage events
- Approve requests
- Verify donations
- Generate certificates
- Send notifications

---

## 5️⃣ User Flow (Mental Model)

### 🧑 Donor Journey
1. Signup / Login  
2. Complete profile (blood type, phone, location)  
3. Register for donation event OR respond to blood request  
4. Donate blood  
5. Receive certificate + notifications  

### 🏥 NGO / Admin Journey
1. Login to admin panel  
2. Create blood donation events  
3. Monitor registrations via QR codes  
4. Verify donation & lab results  
5. Generate certificates  
6. Send notifications  

---

## 6️⃣ Understanding the Admin System

### Why Admin is Powerful
Samarpan uses a **permission-based admin system**, not a single hard-coded admin.

### Admin Levels
- **Super Admin** → Full access
- **Regular Admin** → Limited permissions

### Permissions Control
Admins can be granted permissions such as:
- Manage users
- Manage events
- Verify donations
- Send notifications
- Generate certificates

This allows NGOs to safely delegate work.

---

## 7️⃣ Project Structure – How to Read the Codebase

```txt
app/
├── (public)/        → Public pages (home, auth, dashboard)
├── admin/           → Admin-only UI
├── api/             → Backend endpoints
├── layout.tsx       → Root layout


8️⃣ API Design Philosophy

Samarpan APIs follow a resource-based structure:

Resource	Example Endpoint
Auth	/api/auth/login
Users	/api/users/[id]
Events	/api/events
Blood Requests	/api/blood-request
Key Principles

JWT-based authentication

Middleware protected routes

Admin-only APIs clearly separated

9️⃣ Environment Variables – Why They Matter

Samarpan heavily relies on environment variables for security.

Critical Variables

MONGODB_URL → Database

JWT_SECRET → Authentication

EMAIL_* → Email notifications

NEXT_PUBLIC_APP_URL → Password reset links

⚠️ If NEXT_PUBLIC_APP_URL is wrong, password reset WILL break in production.

🔔 Notification System

Samarpan supports multi-channel notifications:

In-app notifications

Email

WhatsApp (optional)

Notification priority:

In-App

Email

WhatsApp (best-effort)

📜 Certificate Generation – How It Works

Donation is marked as completed

Admin verifies donation

PDF certificate is generated

Certificate is stored and linked to donor

Donor can download anytime

Libraries used:

PDFKit

PDF-Lib

🧪 Development Workflow
Recommended Learning Order for Developers

Run the project locally

Explore public pages

Log into admin panel

Read lib/auth.ts

Read one API route fully

Trace UI → API → DB flow

🚀 Deployment Checklist

Before deploying:

MongoDB connected

Admin created

Email working

NEXT_PUBLIC_APP_URL set

JWT secret strong

HTTPS enabled

🧠 Key Design Decisions

Next.js fullstack → simpler deployment

MongoDB → flexible schema for NGOs

Permission-based admin → scalable NGOs

QR codes for events → faster check-in

WhatsApp support → real-world accessibility

🤝 How to Contribute Effectively

When adding features:

Keep components small

Add permission checks

Reuse existing patterns

Update admin permissions if needed

Test both user & admin flows

🛣️ Learning Outcomes

By working on Samarpan, you will learn:

Fullstack Next.js

JWT authentication

Admin systems

Event-based workflows

PDF generation

Notification architecture

NGO-grade software design

❤️ Final Note

Samarpan is not just a project — it’s a life-saving platform.
Every improvement you make can help someone get blood faster.

Build responsibly. Test carefully. Deploy confidently.

Made with ❤️ to save lives


---

If you want, I can also:
- ✨ Simplify this for **non-technical NGO staff**
- 📘 Create a **`docs/learning-path.md`**
- 🧭 Convert this into **GitHub Wiki pages**
- 🧠 Add **architecture diagrams**

Just tell me 👍
