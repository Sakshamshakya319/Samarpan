# Blood Donation State Management & Events Implementation

## Overview
This document outlines the implementation of three major features:
1. Enhanced Blood Donation State Tracking (Amazon-like delivery tracking)
2. Events Management System
3. Direct Admin Notifications

---

## 1. Blood Donation State Management

### Status Flow
```
accepted → transportation_needed → image_uploaded → fulfilled
```

### MongoDB Schema - `acceptedBloodRequests` Collection

```javascript
{
  _id: ObjectId,
  bloodRequestId: ObjectId,        // Reference to blood request
  userId: ObjectId,                 // Reference to donor user
  userName: String,
  userEmail: String,
  userPhone: String,
  bloodGroup: String,               // e.g., "O+", "AB-"
  quantity: Number,                 // units
  
  // Status Tracking (NEW)
  status: String,                   // "accepted" | "transportation_needed" | "image_uploaded" | "fulfilled"
  needsTransportation: Boolean,     // Set when admin arranges transport
  
  acceptedAt: Date,
  updatedAt: Date,
}
```

### API Endpoints

#### 1. Update Donation Status
**Endpoint:** `POST /api/admin/blood-donations/update-status`
**Auth:** Admin Token Required
**Body:**
```json
{
  "acceptanceId": "ObjectId",
  "newStatus": "transportation_needed|image_uploaded|fulfilled",
  "needsTransportation": true/false  // optional
}
```
**Response:**
- Updates the acceptance record
- Creates automatic notification for user
- Returns updated status

#### 2. Get Accepted Donations (Enhanced)
**Endpoint:** `GET /api/admin/accepted-donations`
**Auth:** Admin Token Required
**Response:**
```json
{
  "requests": [
    {
      "_id": "ObjectId",
      "acceptanceId": "ObjectId",
      "userId": "ObjectId",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "userPhone": "+91-9876543210",
      "bloodGroup": "O+",
      "quantity": 1,
      "acceptedAt": "2024-12-15T10:30:00Z",
      "status": "transportation_needed",
      "needsTransportation": true,
      "updatedAt": "2024-12-15T11:00:00Z",
      "bloodRequest": {
        "reason": "Emergency surgery at City Hospital",
        "urgency": "critical",
        "createdAt": "2024-12-15T09:00:00Z"
      }
    }
  ],
  "total": 1
}
```

### Frontend Component: `AdminDonationsManagerEnhanced`

**Features:**
- Display all accepted blood donations with status tracking
- Shows donor details (name, email, phone)
- Shows transportation needs with checkmark indicator
- Action buttons to progress donation through states:
  - "Arrange Transport" (for accepted status)
  - "Image Uploaded" (to mark image receipt)
  - "Mark Fulfilled" (final state - sends congratulation notification)
- Loading states and error handling
- Real-time status badges with color coding

**Status Badge Colors:**
- Blue: Accepted
- Orange: Transportation Arranged
- Purple: Image Uploaded
- Green: Fulfilled

---

## 2. Events Management System

### MongoDB Schema - `events` Collection

```javascript
{
  _id: ObjectId,
  title: String,                    // "Blood Donation Camp - Delhi"
  description: String,              // Detailed event description
  eventDate: Date,                  // When the event happens
  startTime: String,                // "10:00 AM"
  endTime: String,                  // "05:00 PM"
  location: String,                 // "Delhi Medical Center, New Delhi"
  expectedAttendees: Number,        // 150
  
  eventType: String,                // "donation_camp" | "platelet_drive" | 
                                    // "awareness_seminar" | "donor_appreciation" | 
                                    // "emergency_camp"
  status: String,                   // "active" | "completed" | "cancelled"
  imageUrl: String,                 // Optional banner image
  
  createdBy: ObjectId,              // Admin who created
  createdAt: Date,
  updatedAt: Date,
}
```

### API Endpoints

#### 1. Create Event (Admin)
**Endpoint:** `POST /api/admin/events`
**Auth:** Admin Token Required
**Body:**
```json
{
  "title": "Blood Donation Camp - Delhi",
  "description": "Join us for a community blood donation camp...",
  "eventDate": "2024-12-20T00:00:00Z",
  "startTime": "10:00",
  "endTime": "17:00",
  "location": "Delhi Medical Center",
  "expectedAttendees": 150,
  "eventType": "donation_camp"
}
```

#### 2. Get Events (Admin)
**Endpoint:** `GET /api/admin/events?status=active`
**Auth:** Admin Token Required
**Query Params:** `status` - filter by status (active, completed, cancelled)

#### 3. Update Event (Admin)
**Endpoint:** `PUT /api/admin/events`
**Auth:** Admin Token Required
**Body:**
```json
{
  "eventId": "ObjectId",
  "title": "Updated Title",
  "description": "Updated description",
  "eventDate": "2024-12-20",
  "location": "New Location",
  // ... other fields
}
```

#### 4. Delete Event (Admin)
**Endpoint:** `DELETE /api/admin/events?eventId=ObjectId`
**Auth:** Admin Token Required

#### 5. Get Public Events (Users)
**Endpoint:** `GET /api/events`
**Auth:** Public (No token required)
**Response:**
```json
{
  "events": [
    {
      "_id": "ObjectId",
      "title": "Blood Donation Camp - Delhi",
      "description": "Community blood donation camp",
      "eventDate": "2024-12-20T00:00:00Z",
      "startTime": "10:00",
      "endTime": "17:00",
      "location": "Delhi Medical Center",
      "expectedAttendees": 150,
      "eventType": "donation_camp"
    }
  ],
  "total": 1
}
```

### Frontend Components

#### Admin: `AdminEventsManager`
**Features:**
- Create new events with form validation
- Display all active events
- Edit existing events
- Delete events with confirmation
- Shows event type badge
- Filter by status

#### User: Updated `/app/(public)/events/page.tsx`
**Features:**
- Fetches events from `/api/events`
- Displays upcoming events in chronological order
- Shows event type tag
- Formatted dates with day of week
- Location and timing information
- Expected attendee count
- Responsive grid layout

---

## 3. Direct Admin Notifications

### Notification System

When admin performs actions on donations, automatic notifications are created:

**Trigger Points:**
1. **Transportation Arranged** (Status → `transportation_needed`)
   - Title: "Transportation Arranged"
   - Message: "Transportation has been arranged for your blood donation. We'll pick you up from your location."

2. **Image Uploaded** (Status → `image_uploaded`)
   - Title: "Donation Image Received"
   - Message: "Thank you! We've received the image of your blood donation. Admin is verifying it."

3. **Donation Fulfilled** (Status → `fulfilled`)
   - Title: "Blood Donation Fulfilled ✓"
   - Message: "Your blood donation has been successfully completed and delivered to the patient. Thank you for saving lives!"

### MongoDB Schema - `notifications` Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  message: String,
  status: String,                   // donation status that triggered this
  acceptanceId: ObjectId,           // Reference to the acceptance
  read: Boolean,
  createdAt: Date,
}
```

---

## 4. Complete Flow Example

### User Perspective
1. User sees blood request matching their blood type
2. User clicks "Accept & Donate" 
   - Button changes to "✓ Blood Donation Accepted" (disabled)
   - "Cancel Donation" button appears
3. Status in DB: `accepted`

### Admin Perspective
1. Admin goes to "Manage Donations" tab
2. Sees donation with status "Accepted"
3. Gets donor's details and transportation need checkbox
4. Clicks "Arrange Transport"
5. Enters donor pickup location
6. Clicks "Confirm & Notify User"
   - Status updates to `transportation_needed`
   - User gets notification: "Transportation Arranged"
7. Once image is uploaded, clicks "Image Uploaded"
   - Status updates to `image_uploaded`
   - User gets notification: "Image Received"
8. After verification, clicks "Mark Fulfilled"
   - Status updates to `fulfilled`
   - User gets congratulation notification

### Database Tracking
```
acceptedBloodRequests:
  - status: "accepted" → transportationRequests created → "transportation_needed"
  - Admin verifies image → "image_uploaded"
  - Admin marks fulfilled → "fulfilled"

notifications:
  - Auto-created at each status transition
  - User sees in dashboard
```

---

## 5. Architecture Benefits

### Status Tracking
- Clear visibility into donation pipeline
- Amazon-style progress tracking
- Multi-step verification process
- Admin can see exactly where each donation stands

### Events Management
- Admin can share events with community
- Events stored persistently in database
- Easy to create/edit/delete events
- Users always see current events

### Direct Notifications
- Users informed at every step
- Personalized messages
- Reduces inquiry emails
- Improves user experience

---

## 6. Data Relationships

```
┌─────────────┐
│ bloodRequest│ (what's needed)
└──────┬──────┘
       │
       │ 1:M
       │
┌──────▼──────────────────┐
│ acceptedBloodRequests   │ (who accepted)
├─────────────────────────┤
│ - userId (who)          │
│ - bloodRequestId (what) │
│ - status (where in flow)│
└──────┬──────────────────┘
       │
       ├──────────────────┬──────────────┐
       │                  │              │
       ▼                  ▼              ▼
 transportationRequests  notifications donationImages
 (pickup/delivery)      (status alerts) (proof)
```

---

## 7. Testing Checklist

- [ ] Admin can create events
- [ ] Admin can edit events
- [ ] Admin can delete events
- [ ] Users see events in /events page
- [ ] User accepts blood donation
- [ ] Admin sees accepted donation in "Manage Donations"
- [ ] Admin can arrange transportation
- [ ] User gets notification when transport arranged
- [ ] Admin can mark image as uploaded
- [ ] Admin can mark donation as fulfilled
- [ ] User gets fulfilled notification
- [ ] Status badges show correct colors
- [ ] Donor information displays correctly
- [ ] Transportation checkmark shows correctly

---

## 8. Future Enhancements

- Event images/banners upload
- RSVP system for events
- Donation completion percentage
- Admin analytics dashboard
- Email notifications in addition to in-app
- SMS notifications via Twilio
- Event location map integration