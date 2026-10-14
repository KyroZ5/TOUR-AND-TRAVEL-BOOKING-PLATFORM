# Lead Systems Architect Blueprint — Tour and Travel Booking Platform

**Source spec:** `Tour And Booking.docx` (Project Prompt Sec. 1-15 + API Integration Requirements A/B/C)
**Stack:** React JS (JSX, functional + hooks) + Vite + Material UI (MUI) + React Router DOM + Firebase Authentication (email/password) + Cloud Firestore + Firebase Storage + Firebase Cloud Functions (Admin SDK) + Leaflet (OpenStreetMap tiles) + Geoapify (location search) + OpenWeather (weather).
**Roles:** Exactly 2 — `customer`, `admin`. No staff role, staff dashboard, or staff management module.
**Constraint:** No complete component code in this document — structural blueprints and design specifications only.

> Collection count note: Sec. 8 lists **9 collections** (users, destinations, tourPackages, departures, bookings, payments, notifications, promotions, activityLogs). The task brief says "10" but enumerates the same 9. Sec. 7H/7J implies a 10th `settings` collection for homepage content / agency details / FAQs. This blueprint covers 9 + `settings` as 10th.

---

## 1. Complete Folder Tree (per Sec. 12 + API Integration Structure)

```text
TOUR-AND-TRAVEL-BOOKING-PLATFORM/
├── .env.example
├── .gitignore
├── README.md
├── firestore.rules
├── storage.rules
├── vite.config.js
├── package.json
├── index.html
├── public/
│   └── vite.svg
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── assets/
    │   ├── images/              # hero-bg.jpg, logo, placeholders
    │   └── styles/              # global.css if needed
    ├── components/
    │   ├── common/              # Navbar.jsx, Footer.jsx, SearchBar.jsx, LoadingScreen.jsx, EmptyState.jsx, ConfirmDialog.jsx, DestinationMap.jsx, WeatherCard.jsx
    │   ├── layout/              # PublicLayout.jsx, CustomerLayout.jsx, AdminLayout.jsx
    │   ├── forms/               # BookingForm.jsx, PackageForm.jsx, DestinationForm.jsx, DepartureForm.jsx, PromotionForm.jsx
    │   ├── cards/               # DestinationCard.jsx, PackageCard.jsx, PromotionCard.jsx
    │   └── tables/              # BookingsTable.jsx, CustomersTable.jsx, PaymentsTable.jsx, PaginatedTable.jsx
    ├── contexts/
    │   └── AuthContext.jsx      # onAuthStateChanged + profile/role fetch
    ├── firebase/
    │   └── firebase.js          # app, auth, db, storage init from VITE_ vars
    ├── hooks/
    │   ├── useAuth.js           # wrapper over AuthContext
    │   ├── useFirestore.js      # generic paginated query hook
    │   └── useDebounce.js       # for Geoapify autocomplete
    ├── pages/
    │   ├── public/              # Home.jsx, Destinations.jsx, DestinationDetails.jsx, TourPackages.jsx, TourDetails.jsx, About.jsx, Contact.jsx
    │   ├── auth/                # Login.jsx, Register.jsx, ForgotPassword.jsx
    │   ├── customer/            # CustomerDashboard.jsx (Overview), MyBookings.jsx, BookingDetails.jsx, CustomerProfile.jsx, Notifications.jsx
    │   └── admin/               # AdminDashboard.jsx (Overview), ManagePackages.jsx, ManageDestinations.jsx, ManageBookings.jsx, ManageCustomers.jsx, ManageDepartures.jsx, ManagePayments.jsx, Promotions.jsx, Reports.jsx, ActivityLogs.jsx, Settings.jsx
    ├── routes/
    │   ├── AppRoutes.jsx        # all <Routes>, public/customer/admin grouping
    │   ├── ProtectedRoute.jsx   # requires auth
    │   └── AdminRoute.jsx       # requires auth + role==admin (UI only; rules enforce)
    ├── services/
    │   ├── authService.js       # register/login/logout/reset, create users/{uid}
    │   ├── userService.js
    │   ├── destinationService.js
    │   ├── packageService.js
    │   ├── departureService.js
    │   ├── bookingService.js    # transaction: validate capacity, price snapshot, ref gen
    │   ├── paymentService.js
    │   ├── notificationService.js
    │   ├── reportService.js     # aggregation + CSV export helpers
    │   ├── activityLogService.js# client read; writes via Cloud Function only
    │   └── api/
    │       ├── locationApi.js   # Geoapify autocomplete + geocode
    │       ├── mapService.js    # lat/lng normalize, tile URL, attribution helper
    │       └── weatherApi.js    # OpenWeather current weather + cache
    ├── theme/
    │   └── theme.js             # navy/teal/orange, sans-serif, component defaults
    └── utils/
        ├── validation.js        # email, phone(PH), password, travelers, dates
        ├── currency.js          # PHP formatting (Intl.NumberFormat en-PH/PHP)
        ├── date.js              # Firestore Timestamp <-> display, date-range checks
        └── bookingRef.js        # unique reference generator (e.g., TTB-XXXXXX)
functions/                      # Firebase Cloud Functions (Node, Admin SDK only)
├── index.js                    # first-admin claim, booking txn fallback, activityLogs writer, role guard
└── package.json
```

**Delta vs Sec. 12 original:** added `Settings.jsx`, `reportService.js`, `activityLogService.js`, `services/api/*`, `common/DestinationMap.jsx`, `common/WeatherCard.jsx`, `utils/bookingRef.js`, `hooks/useDebounce.js`, `functions/`.

**Env (`src/firebase/firebase.js` reads):** `VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID, VITE_LOCATION_API_KEY, VITE_WEATHER_API_KEY`

---

## 2. Firestore JSON Schema + Field Constraints

Conventions: `*` = required. `TS` = Firestore Timestamp. IDs: `users/{uid}` keyed by Auth UID; others auto-ID. Money: **integer centavos (PHP)** recommended to avoid float errors (display via `currency.js`). Enums enforced in `firestore.rules` + `validation.js`.

### 2.1 `users` — DocID = Auth UID
```json
{
  "uid": "auth-uid-string*",
  "fullName": "Juan Dela Cruz* (string 2..100)",
  "email": "juan@mail.com* (string, email)",
  "phone": "+639171234567* (string, E.164/PH)",
  "role": "customer* (enum: customer|admin, default customer, immutable from client)",
  "accountStatus": "active* (enum: active|disabled, default active)",
  "createdAt": "TS* (serverTimestamp)",
  "updatedAt": "TS* (serverTimestamp)"
}
```
- Public register forces `role=customer`; client cannot write `role`.
- `accountStatus` disable must go through Auth (disable user) + Function, not Firestore flag alone.

### 2.2 `destinations`
```json
{
  "name": "El Nido* (string 2..120, index)",
  "country": "Philippines* (2..80)",
  "region": "Palawan (0..80)",
  "location": "Palawan, Philippines* (2..150, hero-search text)",
  "description": "Long text* (20..5000)",
  "imageUrls": ["https://...* (array<string-url>, 1..10)"],
  "category": "beach (enum: beach|mountain|city|cultural|adventure|island|heritage, index)",
  "latitude": 11.19,
  "longitude": 119.39,
  "(number -90..90 / -180..180, nullable; from Geoapify or admin entry)",
  "isPublished": true,
  "isFeatured": false,
  "(boolean*, indexes for public queries)",
  "isArchived": false,
  "createdAt": "TS*",
  "updatedAt": "TS*"
}
```
- Delete blocked if `tourPackages.destinationId` references it or historical bookings exist → set `isArchived=true`.

### 2.3 `tourPackages`
```json
{
  "name": "El Nido 3D2N Escape* (2..150)",
  "destinationId": "destDocId* (string, ref to destinations, index)",
  "description": "...* (20..8000)",
  "category": "island* (same enum + joiner|promo, index)",
  "pricePerPerson": 1299900,
  "(* int centavos >=0, trusted price source)",
  "durationDays": 3,
  "durationNights": 2,
  "(* int 1..60)",
  "itinerary": [{ "day": 1, "title": "...*", "details": "...*" }],
  "(* array 1..30, ordered by day)",
  "inclusions": ["Hotel", "Transfers"],
  "exclusions": ["Airfare"],
  "(array<string 1..200>, 0..30 each)",
  "imageUrls": ["https://... (1..10)"],
  "accommodation": "3-star beach resort (0..500, nullable)",
  "transportation": "Van + boat (0..500, nullable)",
  "cancellationPolicy": "Free cancel 7d before...* (10..3000)",
  "travelReminders": "Bring ID... (0..3000)",
  "isPublished": true,
  "isFeatured": false,
  "isArchived": false,
  "promotionId": "promoDocId|null (nullable ref)",
  "createdAt": "TS*",
  "updatedAt": "TS*"
}
```
- Edits must not mutate historical `bookings.pricePerPerson` snapshots.

### 2.4 `departures`
```json
{
  "packageId": "pkgDocId* (string, index)",
  "departureDate": "TS* (future only at create, index)",
  "returnDate": "TS* (> departureDate)",
  "capacity": 30,
  "bookedCount": 12,
  "(* int; capacity 1..500; bookedCount 0..capacity, txn-only increments)",
  "status": "open* (enum: open|closed|cancelled|completed, index)",
  "createdAt": "TS*",
  "updatedAt": "TS*"
}
```
- `remainingSlots = capacity - bookedCount` is derived; never trust client value.
- `capacity` cannot drop below `bookedCount` without explicit resolution flow.

### 2.5 `bookings`
```json
{
  "bookingReference": "TTB-7X2K9Q* (string unique, index, server-generated)",
  "customerId": "uid* (index)",
  "packageId": "pkgId*",
  "departureId": "depId* (indexes)",
  "customerName": "Juan Dela Cruz* (snapshot 2..100)",
  "customerEmail": "j@mail.com*",
  "customerPhone": "+639..* (snapshots)",
  "numberOfTravelers": 2,
  "(* int 1..capacity)",
  "pricePerPerson": 1299900,
  "totalPrice": 2599800,
  "(* int snapshots; totalPrice = pricePerPerson * travelers, recalc server-side)",
  "bookingStatus": "pending* (enum: pending|confirmed|rejected|cancelled|completed, index)",
  "paymentStatus": "unpaid* (enum: unpaid|pending_verification|partially_paid|paid|refunded, index)",
  "specialRequests": "Vegetarian... (0..1000)",
  "adminNotes": "VIP... (admin-only, 0..2000)",
  "statusHistory": [{ "status": "pending", "at": "TS", "by": "uid" }],
  "createdAt": "TS* (index)",
  "updatedAt": "TS*"
}
```
- Booking policy decision (must be consistent): does `pending` reserve seats (`bookedCount++` at create, decrement on reject/cancel)? Implement via transaction/Function.

### 2.6 `payments`
```json
{
  "bookingId": "bookDocId* (index)",
  "customerId": "uid* (index)",
  "amount": 2599800,
  "(* int centavos >0)",
  "paymentMethod": "gcash_deposit* (enum: bank_transfer|gcash|maya|cash|card_manual|other)",
  "referenceNumber": "1234567890* (3..100, proof ref, index)",
  "receiptUrl": "https://... (nullable upload URL)",
  "paymentStatus": "pending_verification* (enum same as booking paymentStatus)",
  "verifiedBy": "adminUid|null",
  "verifiedAt": "TS|null",
  "createdAt": "TS*"
}
```
- Never store card numbers/CVV/passwords. `paid` only via admin verify or gateway webhook — never on receipt upload alone.

### 2.7 `notifications` — per-user, customer read-own only
```json
{
  "userId": "uid* (index)",
  "title": "Booking confirmed* (3..120)",
  "message": "Your trip on...* (5..1000)",
  "type": "booking_confirmed (enum: booking_submitted|booking_confirmed|booking_rejected|booking_cancelled|payment_verified|schedule_updated|promo|system)",
  "isRead": false,
  "(boolean*)",
  "relatedBookingId": "bookId|null",
  "createdAt": "TS* (index desc)"
}
```

### 2.8 `promotions`
```json
{
  "title": "Summer 20% Off* (3..120)",
  "description": "...* (10..2000)",
  "imageUrl": "https://... (nullable)",
  "discountType": "percent (enum: percent|fixed|package_override)",
  "discountValue": 20,
  "(* number >0; if percent 1..90)",
  "applicablePackageIds": ["pkgId"],
  "(array, empty = sitewide)",
  "startDate": "TS*",
  "endDate": "TS* (end > start)",
  "isActive": true,
  "(boolean*; display only if isActive && now in [start,end])",
  "createdAt": "TS*",
  "updatedAt": "TS*"
}
```

### 2.9 `activityLogs` — Function-written only
```json
{
  "actorUid": "adminUid* (index)",
  "action": "booking.confirmed (enum: package.*|destination.*|booking.*|payment.verified|customer.disabled|settings.updated|promotion.*)",
  "targetType": "booking (enum: package|destination|booking|customer|departure|payment|promotion|settings)",
  "targetId": "docId*",
  "metadata": { "from": "pending", "to": "confirmed" },
  "(map, no excess PII)",
  "createdAt": "TS* (index desc)"
}
```

### 2.10 `settings` (10th, singleton `settings/site`)
```json
{
  "agencyName": "...*",
  "contactEmail": "...",
  "contactPhone": "...",
  "address": "...",
  "socials": { "facebook": "url", "instagram": "url" },
  "heroTitle": "Discover Your Next Adventure.",
  "featuredDestinationIds": ["destId (max 8)"],
  "featuredPackageIds": ["pkgId (max 8)"],
  "faqs": [{ "q": "...*", "a": "...*" }],
  "cancellationPolicyDefault": "...*",
  "updatedBy": "adminUid",
  "updatedAt": "TS*"
}
```

**Recommended composite indexes:** `tourPackages(destinationId,isPublished)`, `tourPackages(isPublished,isFeatured)`, `departures(packageId,status,departureDate)`, `bookings(customerId,createdAt desc)`, `bookings(bookingStatus,createdAt)`, `payments(bookingId,createdAt)`, `notifications(userId,isRead,createdAt)`.

**Security mapping (for `firestore.rules`):** customers read-own `users/{uid}` (permitted fields only), own `bookings`/`payments`/`notifications`; cannot write `role`, `bookingStatus=confirmed`, `paymentStatus=paid`, or `activityLogs`. Admin paths gated by custom claim / trusted `users/{uid}.role==admin` read (never client-writable). Deny by default.

---

## 3. Architecture Implementation Checklist — Phase 1 to Phase 6

### Phase 1 — Project Setup
- [ ] Scaffold Vite React (JS/JSX), install `firebase react-router-dom @mui/material @mui/icons-material @emotion/react @emotion/styled leaflet react-leaflet`.
- [ ] Create folder tree §1 + `theme.js` (navy/teal/orange), layouts, `firebase.js` + `.env.example` + README setup.
- [ ] Init Firebase project: Auth (email/pass), Firestore, Storage; record `VITE_` keys.
- [ ] Draft `firestore.rules` + `storage.rules` skeletons (deny-by-default).

### Phase 2 — Authentication + Security
- [ ] `AuthContext.jsx` (onAuthStateChanged → fetch `users/{uid}` → role), loading screen.
- [ ] `Login/Register/ForgotPassword` + validation + error mapping (invalid-credential, disabled, network).
- [ ] Register flow: Auth create → `users/{uid}` with `role:customer` (Function or rules-guarded).
- [ ] `ProtectedRoute` / `AdminRoute` + role redirects (customer→/, admin→/admin).
- [ ] First admin via Admin SDK/Console + custom claim (never client-selectable); finalize rules per §2 security mapping.

### Phase 3 — Public Website (Firestore-driven)
- [ ] Public layout: Navbar (auth-aware menu + mobile drawer), Footer (contact/policy/socials from `settings/site`).
- [ ] Home: hero (headline + Geoapify search + date/pax + Search/Explore), Featured Destinations (`isFeatured && isPublished`), Popular Packages, Why Choose Us, Special Offers (active promos only), How It Works, Testimonials, FAQ.
- [ ] Destinations + DestinationDetails (gallery, info, activities, related packages, schedules, `DestinationMap` + `WeatherCard` with graceful missing-coords/API-key handling).
- [ ] TourPackages + TourDetails (filters: destination/price/duration/category/date/availability; sort price/duration/name; `Total = pricePerPerson × travelers` display, server recalc enforced).
- [ ] `locationApi.js` (debounced autocomplete), `weatherApi.js` (async/await, loading, cache, fail-open), `mapService.js` + attribution.

### Phase 4 — Customer Bookings
- [ ] Booking form on TourDetails (departure select, pax, contact, special requests, live total).
- [ ] `bookingService.createBooking` transaction/Function: auth check → package published → departure open/future → pax valid → capacity check → trusted price → `pending` + ref gen + `bookedCount` per policy + notification.
- [ ] MyBookings (ref/pkg/dates/pax/total/status/payment/date, filters), BookingDetails (itinerary, breakdown, history, policy), cancel-eligible flow.
- [ ] Profile (name/phone; email/password via Auth), Notifications page (own only).

### Phase 5 — Admin Dashboard
- [ ] Admin shell (sidebar/topbar/profile menu, admin-only guard) + Overview (8 stat cards + 5 charts from live Firestore; revenue = verified `paid` only, excl. cancelled/unpaid).
- [ ] Packages/Destinations CRUD + publish/unpublish/archive (+ featured flags); safe-delete guard.
- [ ] Departures CRUD + open/close, capacity guard (`capacity >= bookedCount`), cancel flow; Bookings table (search/filter/paginate, confirm/reject/cancel, admin notes, history); Payments verify flow; Customers (search/filter, detail+history, disable via Auth+Function); Promotions/homepage content + date validation; Reports (date-range + CSV); ActivityLogs (Function-written list); Settings editor.

### Phase 6 — Testing + Hardening
- [ ] Role/permission matrix test (anon/customer/admin × every route + rules playground).
- [ ] Booking stress: overbooking race, duplicate submit (idempotency), price tamper rejection, last-seat concurrency.
- [ ] API resilience: no keys, 429/5xx, empty/invalid search, missing coords — site stays bookable when weather/map/location down.
- [ ] UX states: loading skeletons, empty, error + Snackbar; responsive (desktop/tablet/mobile).
- [ ] Rules audit (type checks, file type/size), remove mock stats, document Function + gateway gaps, finalize README + `.env.example` (Geoapify/OpenWeather key steps + tile usage policy).

---

## Handoff Prompt for Next AI Agent

```text
Continue the Tour and Travel Booking Platform task.
Stack: React JS + Vite + MUI + Firebase Auth + Firestore + Leaflet + Geoapify + OpenWeather.
Roles: exactly Customer and Admin, no staff.

Blueprint file ARCHITECTURE_BLUEPRINT.md defines folder tree, Firestore schemas (users, destinations, tourPackages, departures, bookings, payments, notifications, promotions, activityLogs, settings), and Phase 1-6 checklist.

Next steps:
- Phase 1: scaffold Vite project, install deps, create folder tree, theme.js, firebase.js, .env.example, firestore.rules / storage.rules stubs.
- Do NOT use mock data. All data from Firestore. Enforce booking transaction + price snapshot + capacity check.

Open decisions: (a) money as centavos-int, (b) pending holds seats, (c) manual payment verify only.
```

**Open decisions for owner:** (a) money as centavos-int vs pesos-float, (b) does `pending` hold seats, (c) manual payment verify only vs gateway later.
