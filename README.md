# Unfazed — Therapy Practice Management Platform

A full-stack MERN application that provides therapists with a complete practice management hub and gives clients a branded portal for intake, booking, payment, and communication.

## Tech Stack

**Backend:** Node.js, Express, MongoDB Atlas, Mongoose, JWT, Socket.io, Razorpay, Nodemailer, PDFKit

**Frontend:** React 18, Vite, Tailwind CSS v4, React Router v6, Axios, Recharts, Socket.io-client

## Features (All 7 Modules)

1. **Auth & Branded Profiles** — JWT auth, slug-based public therapist pages
2. **Scheduling** — Timezone-aware availability, buffer times, session durations, instant booking with conflict prevention, waitlist
3. **Client CRM & Intake** — Client management, intake forms, digital consent capture with audit trail
4. **Payments** — Razorpay integration, session packages (3/6/12), GST-style PDF invoices, webhook handling
5. **Clinical Documentation** — Private/shared note split enforced at API layer, SOAP/DAP templates
6. **Communication** — Real-time chat via Socket.io, event-driven notifications
7. **Subscriptions & Entitlements** — Config-driven tiers, centralized EntitlementService.canAccess(), feature gating, analytics with MongoDB aggregation pipelines

## Architecture Principles

- Centralized entitlement checks — every gated route calls EntitlementService.canAccess(), never checks tier strings directly
- Private vs shared data split at the API layer — not just UI
- All monetary values & caps as configuration — no hardcoded constants
- Third-party integrations isolated behind service interfaces — Razorpay, notifications, PDF generation are swappable

## Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier)
- Razorpay test account (free)

### Backend Setup

cd unfazed-backend
npm install

Create .env:
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/unfazed
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
CLIENT_URL=http://localhost:5173
NODE_ENV=development

Seed and start:
npm run seed
npm run dev

### Frontend Setup

cd unfazed-frontend
npm install

Create .env:
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxx

Start:
npm run dev

Open http://localhost:5173

## Tech Stack Details

Backend:
- Express.js REST API
- MongoDB Atlas cloud database
- JWT authentication
- Socket.io real-time chat
- Razorpay payment gateway
- PDFKit invoice generation
- Nodemailer notifications

Frontend:
- React 18 with Vite
- Tailwind CSS v4
- React Router v6
- Axios HTTP client
- Recharts analytics
- Socket.io client

## Project Structure

unfazed-platform/
├── unfazed-backend/
│   ├── src/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   ├── server.js
│   ├── seed.js
│   └── package.json
│
└── unfazed-frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── context/
    │   ├── hooks/
    │   └── utils/
    ├── vite.config.js
    └── package.json

## API Endpoints

Auth:
- POST /api/auth/register — Therapist signup
- POST /api/auth/login — Therapist login
- POST /api/auth/client/register — Client signup
- POST /api/auth/client/login — Client login

Therapist:
- GET /api/clients — List clients
- POST /api/clients — Create client
- GET /api/availability — Get availability
- PUT /api/availability/weekly-template — Update availability
- POST /api/notes — Create session note
- GET /api/analytics/stats — Dashboard stats

Client:
- GET /api/bookings/available-slots — Available time slots
- POST /api/bookings/book — Book a session
- GET /api/notes/client/:id — Client's shared notes
- GET /api/payments/client/:id — Client's payments

Payments:
- POST /api/payments/verify — Verify Razorpay payment
- GET /api/payments/invoice/:id — Download invoice PDF

Subscriptions:
- GET /api/subscriptions/tiers — Available tiers
- GET /api/subscriptions/check/:feature — Check feature access

## Security Highlights

- Passwords hashed with bcrypt (10 rounds)
- JWT-based sessions with role separation
- Private notes NEVER returned on client-facing routes (API-enforced)
- Entitlement checks centralized in one service
- CORS-restricted to whitelisted origins
- Razorpay webhook signature verification
- API-level access control (not just UI)

## Author

Karthick — Major Project, Web Development Program