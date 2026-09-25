# HallFinder Mobile App - Product Requirements Document (PRD)

## Problem Statement & Origin
Built from `https://github.com/ssfarhal/HallFinder.git`, HallFinder is a full-stack convention and wedding hall discovery, reservation marketplace, and venue management mobile app for India with a BookMyEvents Dark Maroon theme (`#6B1C1C`).

## User Personas
1. **Free Tier Browsers**: Customers discovering convention halls by pincode (Bangalore, Chennai, Hyderabad, Mumbai, Delhi), viewing photo galleries, exploring seating/dining capacities, checking power generator specs, opening Google Maps navigation, and reading verified customer reviews.
2. **Pro Event Planners & Families**: Customers who have upgraded to Pro (via Cashfree payment or secret VIP code `GT011103`) to unlock exact per-day pricing breakdowns, real-time availability calendars with green open / red booked status, direct venue owner & manager call/WhatsApp contacts, verified review submissions, and instant booking reservation deposits.
3. **Hall Owners & Venue Managers**: Venue managers using the Owner Desk tab (`/(tabs)/admin`) to list new convention halls, block/unblock dates on the calendar, monitor incoming booking enquiries, and write official replies to customer reviews.
4. **Platform Admin**: Administrators inspecting platform analytics (total halls, Pro subscribers, total enquiries, reviews) and moderation oversight.

## Key Features Implemented

### 1. Convention Hall Discovery & Regional Pincode Directory
- Real-time search across 6-digit Indian pincodes (560001, 560034, 600001, 400001, 110001, 500081).
- Category filter pills (Wedding, Reception, Engagement, Corporate) and capacity thresholds (500+, 1000+, 1500+, 2000+ seats).
- Amenity toggles (100% DG Soundproof Power Backup, Valet Parking).
- Regional City & Pincode Directory tab (`/(tabs)/pincodes`) for one-tap location exploration.

### 2. Two-Tier Access System
- **Free Tier**: Free browsing, photo galleries, capacity metrics, amenity checklist, Google Maps link, and reading verified reviews.
- **Pro Tier (HallFinder Pro)**:
  - Exact Per-Day Pricing Breakdown (base rent, advance deposit, cleaning & maintenance, 18% GST).
  - Real-time live availability calendar.
  - Direct venue owner & manager phone calling and WhatsApp messaging.
  - Shortlisting & saving favourite halls (`/(tabs)/favorites`).
  - Submitting 1 to 5 star verified customer reviews and ratings.
  - Instant reservation deposit payments.

### 3. VIP Secret Unlock Code & Cashfree Payments (3 Tiers)
- **3 Cashfree Subscriptions**:
  - **Weekly Pro Pass**: 7 Days for ₹100 (Short term)
  - **Quarterly Pro Plan**: 3 Months for ₹300 (₹100/mo)
  - **Annual Pro Plan**: 1 Year for ₹500 (₹42/mo - Save 45%)
- **VIP Secret Code `GT011103`**: Grants 1-Year Full HallFinder Pro Access for free without payment.
- 1-Tap Sandbox Upgrade for instant developer and reviewer verification.

### 4. Dynamic Pro Branding Rule
- App name dynamically displays as **"HallFinder"** for all unsubscribed/free users.
- App name displays as **"HallFinder Pro"** (with glowing gold sparkles & PRO badge) ONLY when the user holds an active Pro subscription.

### 5. Dedicated Public Legal Pages (/terms & /privacy)
- **Privacy Policy (`/privacy`)**: Covers user account data collection, Google OAuth & Apple Sign In usage, Cashfree payment processing, third-party API/owner venue listing data, customer reviews/ratings storage, and an unequivocal guarantee that user data is never sold to third parties.
- **Terms & Conditions (`/terms`)**: Covers the 3 subscription plans (7 Days ₹100, 3 Months ₹300, 1 Year ₹500), Pro feature access, secret VIP code GT011103 rules, strict no-refund policy for digital subscriptions, and customer & hall owner code of conduct.
- Accessible directly at public routes without requiring login, and linked in the app footer and login/signup sheet.

### 4. Verified Reviews & Ratings System
- Pro customers can submit 1-5 star ratings, review title, detailed comments, and event type.
- MongoDB atomically recalculates hall average rating and review counts.
- Venue owners can post official replies to customer reviews via the Owner Desk.

### 5. Owner Desk & Admin Management (`/(tabs)/admin`)
- Review monitoring & sentiment overview (Average score, total reviews, positive score percentage).
- Owner Hall Management: block/unblock specific dates on the calendar with real-time sync.
- "+ Add Hall" modal for owner self-listing into MongoDB with amenities, capacities, and pricing.
- Platform analytics dashboard showing total venues, Pro subscribers, and enquiry volume.

### 6. Booking Enquiries & Instant Reservation Marketplace (`/(tabs)/enquiries`)
- Booking Enquiry submission with date locking in MongoDB and unique reference ID generation (`ENQ-XXXXXX`).
- Instant Hall Reservation with deposit calculation and paid booking confirmation (`BK-XXXXXX`).
- Soft cancellation support freeing up reserved dates on the calendar.

### 7. Full Authentication Suite
- 1-Tap Quick Demo Login with 3 pre-seeded personas:
  - Customer / Pro Planner: `arjun.sharma@example.com` / `Password@123`
  - Hall Owner: `owner.srikrishna@example.com` / `Password@123`
  - Platform Admin: `admin@hallfinder.com` / `Password@123`
- Email & Password JWT Registration & Login.
- Google OAuth session integration & Apple Login.
- Bearer token session management in local storage.

## Endpoints Summary
- **Halls**: `GET /api/halls`, `GET /api/halls/featured`, `GET /api/halls/{id}`, `POST /api/halls`, `PUT /api/halls/{id}`, `DELETE /api/halls/{id}`, `GET /api/halls/{id}/availability`, `POST /api/halls/{id}/booked-dates`, `GET /api/pincodes`
- **Reviews**: `GET /api/halls/{id}/reviews`, `POST /api/halls/{id}/reviews`, `GET /api/admin/reviews`, `POST /api/reviews/{id}/reply`
- **Memberships**: `GET /api/plans`, `POST /api/payments/checkout`, `GET /api/payments/{id}/verify`, `GET /api/user/membership`, `POST /api/user/membership/secret-unlock`, `POST /api/user/membership/upgrade-mock`
- **Enquiries & Bookings**: `POST /api/enquiries`, `GET /api/enquiries`, `GET /api/enquiries/{id}`, `PATCH /api/enquiries/{id}/cancel`, `POST /api/bookings`, `GET /api/bookings`
- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/demo-login`, `POST /api/auth/session`, `POST /api/auth/apple`, `GET /api/auth/me`, `POST /api/auth/logout`
- **Admin**: `GET /api/admin/stats`, `POST /api/seed`

## Prioritized Backlog
- **P0**: Core discovery, pincode search, Free/Pro tier gating, VIP code `GT011103`, reviews, real-time availability calendar, Owner Desk, and instant reservation deposits (Completed).
- **P1**: Push notifications for enquiry status updates upon native build deployment.
- **P2**: Photo uploads in customer reviews via Emergent Managed Object Storage.
