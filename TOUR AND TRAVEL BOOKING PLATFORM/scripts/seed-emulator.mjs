// Seeds the Firebase Emulator Suite with demo data.
//
// Usage:
//   1. npm run emulators        (in one terminal)
//   2. npm run seed:emu         (in another terminal)
//
// Safe to run repeatedly - users are reused and documents are overwritten.

process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-tour-travel';

const { initializeApp } = await import('firebase-admin/app');
const { getAuth } = await import('firebase-admin/auth');
const { getFirestore, Timestamp } = await import('firebase-admin/firestore');

const PROJECT_ID = 'demo-tour-travel';

const app = initializeApp({ projectId: PROJECT_ID });
const auth = getAuth(app);
const db = getFirestore(app);

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const at = (daysFromNow) => Timestamp.fromDate(new Date(now + daysFromNow * DAY));

async function ensureUser({ email, password, displayName, role, phone }) {
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password, displayName });
  }
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    fullName: displayName,
    email,
    phone,
    role,
    accountStatus: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return user;
}

const image = (seed) => `https://picsum.photos/seed/${seed}/1200/800`;

async function seed() {
  console.log('Seeding users...');
  const admin = await ensureUser({
    email: 'admin@wanderlust.test',
    password: 'Admin1234',
    displayName: 'Ada Admin',
    role: 'admin',
    phone: '+63 917 000 0001',
  });
  const customer = await ensureUser({
    email: 'customer@wanderlust.test',
    password: 'Customer1234',
    displayName: 'Carlos Customer',
    role: 'customer',
    phone: '+63 917 000 0002',
  });

  const destinations = [
    {
      id: 'dest-boracay',
      name: 'Boracay',
      country: 'Philippines',
      region: 'Western Visayas',
      location: 'Malay, Aklan',
      description:
        'Famous for its powdery white sand and vibrant sunsets, Boracay is the Philippines premier beach destination.',
      category: 'beach',
      latitude: 11.9674,
      longitude: 121.9248,
      isFeatured: true,
    },
    {
      id: 'dest-bohol',
      name: 'Bohol',
      country: 'Philippines',
      region: 'Central Visayas',
      location: 'Tagbilaran, Bohol',
      description:
        'Home to the iconic Chocolate Hills and tarsiers, Bohol blends natural wonders with rich heritage.',
      category: 'nature',
      latitude: 9.8349,
      longitude: 124.1413,
      isFeatured: true,
    },
    {
      id: 'dest-palawan',
      name: 'El Nido, Palawan',
      country: 'Philippines',
      region: 'MIMAROPA',
      location: 'El Nido, Palawan',
      description:
        'Towering limestone cliffs, hidden lagoons and crystal-clear waters make El Nido a bucket-list paradise.',
      category: 'island',
      latitude: 11.1800,
      longitude: 119.3900,
      isFeatured: true,
    },
    {
      id: 'dest-siargao',
      name: 'Siargao',
      country: 'Philippines',
      region: 'Caraga',
      location: 'General Luna, Surigao del Norte',
      description:
        'The surfing capital of the Philippines, fringed by palm trees, lagoons and laid-back island life.',
      category: 'adventure',
      latitude: 9.8500,
      longitude: 126.0500,
      isFeatured: false,
    },
  ];

  const packages = [
    {
      id: 'pkg-boracay-3d2n',
      name: 'Boracay Beach Escape',
      destinationId: 'dest-boracay',
      category: 'beach',
      description:
        'A 3-day, 2-night island escape with beachfront accommodation, island hopping and a sunset sail.',
      pricePerPerson: 1299900,
      durationDays: 3,
      durationNights: 2,
      isFeatured: true,
      inclusions: ['Beachfront hotel', 'Daily breakfast', 'Island hopping tour', 'Sunset paraw sail'],
      exclusions: ['Airfare', 'Travel insurance', 'Personal expenses'],
      accommodation: '4-star beachfront resort',
      transportation: 'Airport transfers included',
      travelReminders: 'Bring sunscreen, swimwear and a valid ID.',
    },
    {
      id: 'pkg-bohol-4d3n',
      name: 'Bohol Countryside Adventure',
      destinationId: 'dest-bohol',
      category: 'nature',
      description:
        'Explore the Chocolate Hills, tarsier sanctuary and Loboc River on a 4-day Bohol countryside tour.',
      pricePerPerson: 1850000,
      durationDays: 4,
      durationNights: 3,
      isFeatured: true,
      inclusions: ['Hotel stay', 'Countryside tour', 'Loboc River cruise lunch', 'Tarsier sanctuary'],
      exclusions: ['Airfare', 'Dinner', 'Travel insurance'],
      accommodation: 'Boutique countryside inn',
      transportation: 'Air-conditioned van transfers',
      travelReminders: 'Wear comfortable walking shoes.',
    },
    {
      id: 'pkg-palawan-5d4n',
      name: 'El Nido Island Odyssey',
      destinationId: 'dest-palawan',
      category: 'island',
      description:
        'Five days exploring the lagoons and limestone cliffs of El Nido with three island-hopping expeditions.',
      pricePerPerson: 2675000,
      durationDays: 5,
      durationNights: 4,
      isFeatured: true,
      inclusions: ['Beach resort', 'Three island-hopping tours', 'Daily breakfast', 'Kayak rental'],
      exclusions: ['Airfare', 'Eco-tourism fees', 'Travel insurance'],
      accommodation: 'Boutique beach resort',
      transportation: 'Van + boat transfers',
      travelReminders: 'Bring a dry bag for island hopping.',
    },
    {
      id: 'pkg-siargao-4d3n',
      name: 'Siargao Surf & Island Hop',
      destinationId: 'dest-siargao',
      category: 'adventure',
      description:
        'Catch waves at Cloud 9 and island-hop to Naked, Daku and Guyam islands on this 4-day surf getaway.',
      pricePerPerson: 2199900,
      durationDays: 4,
      durationNights: 3,
      isFeatured: false,
      inclusions: ['Surf camp stay', 'Beginner surf lesson', 'Island hopping', 'Daily breakfast'],
      exclusions: ['Airfare', 'Meals not mentioned', 'Travel insurance'],
      accommodation: 'Beachfront surf camp',
      transportation: 'Airport transfers included',
      travelReminders: 'Surf lessons are beginner-friendly.',
    },
  ];

  const departures = [
    { id: 'dep-boracay-1', packageId: 'pkg-boracay-3d2n', start: 21, capacity: 20, booked: 6 },
    { id: 'dep-boracay-2', packageId: 'pkg-boracay-3d2n', start: 45, capacity: 20, booked: 20 },
    { id: 'dep-bohol-1', packageId: 'pkg-bohol-4d3n', start: 30, capacity: 15, booked: 4 },
    { id: 'dep-bohol-2', packageId: 'pkg-bohol-4d3n', start: 60, capacity: 15, booked: 0 },
    { id: 'dep-palawan-1', packageId: 'pkg-palawan-5d4n', start: 40, capacity: 12, booked: 12 },
    { id: 'dep-palawan-2', packageId: 'pkg-palawan-5d4n', start: 75, capacity: 12, booked: 3 },
    { id: 'dep-siargao-1', packageId: 'pkg-siargao-4d3n', start: 28, capacity: 10, booked: 2 },
    { id: 'dep-siargao-2', packageId: 'pkg-siargao-4d3n', start: 55, capacity: 10, booked: 10 },
  ];

  const promotions = [
    {
      id: 'promo-summer',
      title: 'Summer Island Sale',
      description: 'Save 15% on all island and beach packages booked this summer.',
      discountType: 'percent',
      discountValue: 15,
      applicablePackageIds: ['pkg-boracay-3d2n', 'pkg-palawan-5d4n', 'pkg-siargao-4d3n'],
      start: -5,
      end: 60,
      isActive: true,
    },
    {
      id: 'promo-earlybird',
      title: 'Early Bird Bohol',
      description: 'Book 30 days ahead and get PHP 1,500 off the Bohol countryside adventure.',
      discountType: 'fixed',
      discountValue: 150000,
      applicablePackageIds: ['pkg-bohol-4d3n'],
      start: -30,
      end: -2,
      isActive: false,
    },
  ];

  const bookings = [
    {
      id: 'book-pending',
      packageId: 'pkg-boracay-3d2n',
      departureId: 'dep-boracay-1',
      packageName: 'Boracay Beach Escape',
      travelers: 2,
      pricePerPerson: 1299900,
      status: 'pending',
      paymentStatus: 'unpaid',
      specialRequests: 'Honeymoon - please arrange a quiet room.',
    },
    {
      id: 'book-confirmed',
      packageId: 'pkg-bohol-4d3n',
      departureId: 'dep-bohol-1',
      packageName: 'Bohol Countryside Adventure',
      travelers: 1,
      pricePerPerson: 1850000,
      status: 'confirmed',
      paymentStatus: 'paid',
      specialRequests: '',
    },
    {
      id: 'book-cancelled',
      packageId: 'pkg-siargao-4d3n',
      departureId: 'dep-siargao-1',
      packageName: 'Siargao Surf & Island Hop',
      travelers: 3,
      pricePerPerson: 2199900,
      status: 'cancelled',
      paymentStatus: 'refunded',
      specialRequests: '',
    },
  ];

  const batch = db.batch();

  destinations.forEach((d) => {
    const ref = db.collection('destinations').doc(d.id);
    batch.set(ref, {
      name: d.name,
      country: d.country,
      region: d.region,
      location: d.location,
      description: d.description,
      imageUrls: [image(d.id)],
      category: d.category,
      latitude: d.latitude,
      longitude: d.longitude,
      isPublished: true,
      isFeatured: d.isFeatured,
      isArchived: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });

  packages.forEach((p) => {
    const ref = db.collection('tourPackages').doc(p.id);
    batch.set(ref, {
      name: p.name,
      destinationId: p.destinationId,
      description: p.description,
      category: p.category,
      pricePerPerson: p.pricePerPerson,
      durationDays: p.durationDays,
      durationNights: p.durationNights,
      itinerary: Array.from({ length: p.durationDays }, (_, i) => ({
        day: i + 1,
        title: `Day ${i + 1}`,
        details:
          i === 0
            ? 'Arrival, check-in and welcome briefing.'
            : i === p.durationDays - 1
            ? 'Leisure time before departure transfer.'
            : 'Guided tours and activities.',
      })),
      inclusions: p.inclusions,
      exclusions: p.exclusions,
      imageUrls: [image(p.id)],
      accommodation: p.accommodation,
      transportation: p.transportation,
      cancellationPolicy: 'Free cancellation up to 7 days before departure.',
      travelReminders: p.travelReminders,
      isPublished: true,
      isFeatured: p.isFeatured,
      isArchived: false,
      promotionId: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });

  departures.forEach((d) => {
    const ref = db.collection('departures').doc(d.id);
    batch.set(ref, {
      packageId: d.packageId,
      departureDate: at(d.start),
      returnDate: at(d.start + 3),
      capacity: d.capacity,
      bookedCount: d.booked,
      status: 'open',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });

  promotions.forEach((p) => {
    const ref = db.collection('promotions').doc(p.id);
    batch.set(ref, {
      title: p.title,
      description: p.description,
      imageUrl: image(p.id),
      discountType: p.discountType,
      discountValue: p.discountValue,
      applicablePackageIds: p.applicablePackageIds,
      startDate: at(p.start),
      endDate: at(p.end),
      isActive: p.isActive,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });

  bookings.forEach((b) => {
    const departure = departures.find((d) => d.id === b.departureId);
    const total = b.pricePerPerson * b.travelers;
    const ref = db.collection('bookings').doc(b.id);
    batch.set(ref, {
      bookingReference: `TTB-${b.id.slice(-6).toUpperCase()}`,
      customerId: customer.uid,
      packageId: b.packageId,
      departureId: b.departureId,
      packageName: b.packageName,
      departureDate: at(departure.start),
      returnDate: at(departure.start + 3),
      customerName: 'Carlos Customer',
      customerEmail: 'customer@wanderlust.test',
      customerPhone: '+63 917 000 0002',
      numberOfTravelers: b.travelers,
      pricePerPerson: b.pricePerPerson,
      totalPrice: total,
      bookingStatus: b.status,
      paymentStatus: b.paymentStatus,
      specialRequests: b.specialRequests,
      adminNotes: '',
      statusHistory: [{ status: b.status, at: Timestamp.now(), by: customer.uid, note: 'Seeded' }],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });

  // A verified payment for the confirmed booking.
  const confirmedTotal = 1850000;
  batch.set(db.collection('payments').doc('pay-confirmed'), {
    bookingId: 'book-confirmed',
    customerId: customer.uid,
    amount: confirmedTotal,
    paymentMethod: 'bank_transfer',
    referenceNumber: 'BDO-2026-0001',
    receiptUrl: '',
    paymentStatus: 'paid',
    verifiedBy: admin.uid,
    verifiedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
  });

  batch.set(db.collection('settings').doc('site'), {
    agencyName: 'Wanderlust Travel',
    contactEmail: 'hello@wanderlust.travel',
    contactPhone: '+63 917 000 0000',
    address: 'Makati City, Metro Manila, Philippines',
    socials: { facebook: 'https://facebook.com', instagram: 'https://instagram.com', twitter: '' },
    heroTitle: 'Discover Your Next Adventure.',
    heroSubtitle:
      'Handpicked destinations, transparent pricing, and hassle-free bookings for your next great journey.',
    featuredDestinationIds: ['dest-boracay', 'dest-palawan', 'dest-bohol'],
    featuredPackageIds: ['pkg-boracay-3d2n', 'pkg-palawan-5d4n', 'pkg-bohol-4d3n'],
    updatedBy: admin.uid,
    updatedAt: Timestamp.now(),
  });

  [
    { action: 'seed', targetType: 'database', targetId: '' },
    { action: 'create', targetType: 'destination', targetId: 'dest-boracay' },
    { action: 'create', targetType: 'tourPackage', targetId: 'pkg-palawan-5d4n' },
  ].forEach((log, index) => {
    batch.set(db.collection('activityLogs').doc(`log-seed-${index + 1}`), {
      actorUid: admin.uid,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      metadata: {},
      createdAt: Timestamp.now(),
    });
  });

  await batch.commit();

  console.log('\nEmulator seed complete.\n');
  console.log('  Admin     : admin@wanderlust.test / Admin1234');
  console.log('  Customer  : customer@wanderlust.test / Customer1234');
  console.log('  Emulator UI: http://127.0.0.1:4000');
  console.log('  App (emulator mode): npm run dev:emu\n');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nSeed failed:', error);
    process.exit(1);
  });
