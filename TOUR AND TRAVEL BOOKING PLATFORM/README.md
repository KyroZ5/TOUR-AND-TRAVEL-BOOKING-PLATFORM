# Wanderlust Travel - Tour & Travel Booking Platform

A full-featured tour and travel booking web application built with **React (Vite)** and
**Firebase**. Customers browse destinations and tour packages, book departures, submit manual
payments, and track their trips. Administrators manage the entire catalogue, bookings, payments,
promotions, customers, reports, and site settings.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Firebase setup](#firebase-setup)
- [Creating the first administrator](#creating-the-first-administrator)
- [Data model](#data-model)
- [How bookings, seats and payments work](#how-bookings-seats-and-payments-work)
- [Available scripts](#available-scripts)
- [Testing](#testing)
- [Deployment](#deployment)

> **Going live?** See **[LIVE_SETUP.md](LIVE_SETUP.md)** for the full production walkthrough
> (Firebase project setup, deploying rules + composite indexes, and hosting).

---

## Features

### Public site
- Home page with hero, featured destinations, and active promotions.
- Destination listing with search/filter and a destination details page with an interactive map.
- Tour package listing and a rich package details page: gallery, itinerary, inclusions,
  exclusions, accommodation, transportation, cancellation policy, travel reminders, and an
  embedded booking form.
- About, Contact (prefilled `mailto:` form), FAQ, privacy, terms, and cancellation policy pages.
- Live weather widget for destinations (OpenWeather) and location search (Geoapify).

### Customer area (`/account`)
- Dashboard with booking statistics and recent activity.
- My Bookings: filter/search bookings, view details, and cancel eligible bookings.
- Booking details: full trip info, price breakdown, status history, and manual payment submission.
- Profile management: edit details and change email / password securely.
- Notifications centre with read/unread state.

### Admin area (`/admin`)
- Overview dashboard with KPIs, monthly booking chart, status breakdown, top packages/destinations.
- Manage Destinations, Tour Packages, Departures, Bookings, Customers, and Payments.
- Confirm / reject / complete / cancel bookings (seats are released automatically where relevant).
- Approve or reject submitted payments (manual verification).
- Promotions manager, Reports with date-range filters and CSV export.
- Immutable Activity Logs of administrative actions.
- Site Settings (agency info, social links, hero copy, FAQs).

---

## Tech stack

| Layer          | Technology                                              |
| -------------- | ------------------------------------------------------- |
| UI             | React 18 + Vite                                         |
| Component lib  | Material UI (MUI) v5 + `@mui/icons-material`            |
| Routing        | React Router v6                                         |
| Backend        | Firebase Authentication, Cloud Firestore, Cloud Storage |
| Maps           | Leaflet + React-Leaflet (OpenStreetMap tiles)           |
| Geocoding      | Geoapify Places API                                     |
| Weather        | OpenWeather Current Weather API                         |

---

## Project structure

```
.
├─ public/                     # static assets (referenced from index.html if added)
├─ src/
│  ├─ components/
│  │  ├─ cards/                # DestinationCard, PackageCard, PromotionCard
│  │  ├─ common/               # Navbar, Footer, EmptyState, ConfirmDialog, StatusChip, WeatherCard...
│  │  ├─ forms/                # BookingForm + admin forms (Package, Destination, Departure, Promotion)
│  │  ├─ layout/               # PublicLayout, CustomerLayout, AdminLayout, AuthLayout
│  │  └─ tables/               # PaginatedTable
│  ├─ contexts/                # AuthContext, SnackbarContext
│  ├─ firebase/                # firebase.js (initialises the Firebase app)
│  ├─ hooks/                   # useAuth, useDebounce, useFirestore
│  ├─ pages/
│  │  ├─ admin/                # 11 admin pages
│  │  ├─ auth/                 # Login, Register, ForgotPassword
│  │  ├─ customer/             # Dashboard, MyBookings, BookingDetails, Profile, Notifications
│  │  └─ public/               # Home, Destinations, DestinationDetails, TourPackages, TourDetails...
│  ├─ routes/                  # AppRoutes, ProtectedRoute, AdminRoute
│  ├─ services/                # Firestore services + api/ (location, map, weather)
│  ├─ theme/                   # MUI theme
│  ├─ utils/                   # currency, date, validation, bookingRef
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ index.css
├─ firestore.rules
├─ firestore.indexes.json   # 15 composite indexes required by the queries
├─ storage.rules
├─ index.html
├─ package.json
└─ vite.config.js
```

---

## Getting started

### Prerequisites
- Node.js 18+ and npm
- A Firebase project (see below)
- API keys for Geoapify and OpenWeather (optional; the app degrades gracefully without them)

### Installation

```bash
npm install
cp .env.example .env      # then fill in your keys
npm run dev
```

The dev server runs at http://localhost:5173.

> **Note:** the app requires Firebase credentials to run. Without them it renders a
> "Firebase is not configured" setup notice instead of crashing. See
> [LIVE_SETUP.md](LIVE_SETUP.md) for production deployment, or use the offline emulator suite
> below for local development with no Firebase project at all.

---

## Environment variables

Create a `.env` file in the project root (see `.env.example`):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_LOCATION_API_KEY=      # Geoapify (destination search)
VITE_WEATHER_API_KEY=       # OpenWeather (weather widget)
```

These Firebase values are the **public web config** and are safe to expose in the browser.
All access is enforced by Security Rules.

---

## Firebase setup

1. **Create a project** in the [Firebase Console](https://console.firebase.google.com/).
2. **Authentication**: enable the *Email/Password* provider.
3. **Firestore**: create a database in production mode.
4. **Storage**: enable Cloud Storage.
5. Copy your web app credentials into `.env`.

### Deploy the security rules

Install the Firebase CLI, then from the project root:

```bash
firebase login
firebase use --add          # select your project
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### Composite indexes

The queries need 15 composite indexes. They are all declared in **`firestore.indexes.json`**
and wired into `firebase.json`, so one command creates them:

```bash
firebase deploy --only firestore:indexes
```

Index builds can take a few minutes. They are required by queries such as *my bookings*
(`customerId` + `createdAt`), *open departures* (`packageId` + `status` + `departureDate`),
*published packages* (`isPublished` + `createdAt`) and *notifications* (`userId` +
`createdAt`). Deployment can be verified under **Firestore → Indexes**.

---

## Creating the first administrator

Public registration **always** creates a `customer`. To create the first admin:

1. Register normally through the app (or add the user in Firebase Authentication).
2. In the Firestore console open `users/{uid}` for that account.
3. Change `role` from `customer` to `admin`.
4. Sign out and back in. The admin area at `/admin` is now accessible.

Optionally seed the `settings/site` document to control public site content (the app falls back
to sensible defaults when it is missing).

---

## Data model

Firestore collections (all money values are stored as **integer centavos**, e.g. `₱12,999.00`
→ `1299900`):

| Collection      | Purpose                                                              |
| --------------- | ------------------------------------------------------------------- |
| `users`         | Profiles: `fullName`, `email`, `phone`, `role`, `accountStatus`      |
| `destinations`  | `name`, `country`, `region`, `location`, `geo`, `images`, `flags`    |
| `tourPackages`  | Full package content + `pricePerPerson`, itinerary, inclusions, etc. |
| `departures`    | `packageId`, `departureDate`, `returnDate`, `capacity`, `bookedCount`|
| `bookings`      | Customer bookings with price snapshot + `statusHistory`              |
| `payments`      | Manual payment submissions with verification state                   |
| `notifications` | Per-user notifications                                               |
| `promotions`    | Discount campaigns with active window                                |
| `settings`      | `settings/site` document with public site content                    |
| `activityLogs`  | Immutable administrative action log                                 |

---

## How bookings, seats and payments work

- **Seat reservation**: a `pending` booking **reserves seats** immediately; `departures.bookedCount`
  is incremented inside a Firestore **transaction** that re-validates availability to prevent
  overbooking. Prices are recalculated server-side from the trusted package document.
- **Lifecycle**: `pending → confirmed → completed`, or `pending/confirmed → rejected/cancelled`.
  Rejecting or cancelling releases the reserved seats (decrements `bookedCount`).
- **Payments**: customers submit a payment reference (amount, method, optional receipt). No booking
  is ever marked paid automatically. An **administrator verifies** each payment, which then updates
  the booking's `paymentStatus` (`pending_verification` → `partially_paid` / `paid`).
- **Cancellation policy**: customers may cancel up to 7 days before departure (configurable on each
  package).

> Security Rules allow authenticated customers to decrement/increment `departures.bookedCount`
> only within `[0, capacity]` and only change that field, so cancellation works on the client
> without a backend. For stricter production hardening this can be moved into a Cloud Function
> using the Admin SDK.

---

## Available scripts

| Command                 | Description                                                   |
| ----------------------- | ------------------------------------------------------------- |
| `npm run dev`           | Start the Vite dev server                                      |
| `npm run dev:emu`       | Dev server pointed at the Firebase Emulator Suite              |
| `npm run build`         | Produce an optimised production build                          |
| `npm run preview`       | Preview the production build locally                           |
| `npm test`              | Run unit + component tests (Vitest, no emulators)              |
| `npm run test:watch`    | Unit/component tests in watch mode                             |
| `npm run test:coverage` | Unit/component tests with coverage report                      |
| `npm run emulators`     | Start Auth/Firestore/Storage emulators (`demo-tour-travel`)    |
| `npm run seed:emu`      | Seed demo data + test accounts into running emulators          |
| `npm run test:rules`    | Run Firestore + Storage Security Rules tests against emulators |
| `npm run test:integration` | Run the end-to-end booking-flow tests against emulators    |

---

## Testing

Automated tests run **fully offline** against the Firebase Emulator Suite — no real project or
credentials required. See **[TESTING.md](TESTING.md)** for the full guide and a manual
smoke-test checklist.

```bash
npm test                 # unit + component (99 tests)
npm run test:rules       # security rules      (40 tests, emulators)
npm run test:integration # booking flow        (8 tests, emulators)
```

Requires **Java 17+** for the emulators (`firebase-tools` is pinned to v14 for this reason).
Seed data for manual testing: `npm run emulators` then `npm run seed:emu`, and sign in with
`admin@wanderlust.test` / `Admin1234` or `customer@wanderlust.test` / `Customer1234`.

---

## Deployment

The production build output (`dist/`) is a static SPA that can be hosted on Firebase Hosting,
Netlify, Vercel, or any static host (all require a SPA rewrite so every route serves
`index.html`).

`firebase.json` is **already configured** for Firebase Hosting (`public: dist`, SPA rewrite,
immutable caching for `/assets/*`). To go live:

```bash
cp .env.example .env       # fill in your Firebase web config + optional API keys
npm run build
firebase deploy --only firestore:rules,firestore:indexes,storage,hosting
```

The composite indexes in `firestore.indexes.json` (15 of them) are required by the app's
queries — deploying rules alone is not enough. For the full step-by-step walkthrough,
including Firebase console setup and creating the first administrator, see
**[LIVE_SETUP.md](LIVE_SETUP.md)**.

---

## License

Created for academic / educational purposes.
