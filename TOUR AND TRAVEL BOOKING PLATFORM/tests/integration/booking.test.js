import { describe, it, beforeAll } from 'vitest';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore, Timestamp } from 'firebase-admin/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../src/firebase/firebase.js';
import {
  createBooking,
  cancelBooking,
  confirmBooking,
  rejectBooking,
  BookingError,
} from '../../src/services/bookingService.js';

const PROJECT_ID = 'demo-tour-travel';
const DAY = 24 * 60 * 60 * 1000;
const CUSTOMER = { email: 'itest-customer@example.com', password: 'Passw0rd!' };
const ADMIN = { email: 'itest-admin@example.com', password: 'Passw0rd!' };

let adminDb;
let adminAuth;
let customerUid;
let adminUid;
let seq = 0;

async function ensureUser({ email, password }, role) {
  let user;
  try {
    user = await adminAuth.getUserByEmail(email);
  } catch {
    user = await adminAuth.createUser({ email, password });
  }
  await adminDb.collection('users').doc(user.uid).set({
    uid: user.uid,
    fullName: `Integration ${role}`,
    email,
    phone: '09171234567',
    role,
    accountStatus: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return user.uid;
}

async function seedPackage({ isPublished = true, isArchived = false } = {}) {
  const id = `itest-pkg-${Date.now()}-${++seq}`;
  await adminDb.collection('tourPackages').doc(id).set({
    name: 'Integration Package',
    destinationId: 'dest-x',
    description: 'A package created for integration testing purposes.',
    category: 'island',
    pricePerPerson: 100000, // ₱1,000
    durationDays: 3,
    durationNights: 2,
    itinerary: [],
    inclusions: [],
    exclusions: [],
    imageUrls: [],
    accommodation: '',
    transportation: '',
    cancellationPolicy: '',
    travelReminders: '',
    isPublished,
    isArchived,
    isFeatured: false,
    promotionId: null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return id;
}

async function seedDeparture({ capacity = 3, bookedCount = 0, status = 'open', daysAhead = 30 } = {}) {
  const id = `itest-dep-${Date.now()}-${++seq}`;
  await adminDb.collection('departures').doc(id).set({
    packageId: 'pkg-x',
    departureDate: Timestamp.fromDate(new Date(Date.now() + daysAhead * DAY)),
    returnDate: Timestamp.fromDate(new Date(Date.now() + (daysAhead + 3) * DAY)),
    capacity,
    bookedCount,
    status,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return id;
}

async function bookedSeats(departureId) {
  const snap = await adminDb.collection('departures').doc(departureId).get();
  return snap.data().bookedCount;
}

async function bookingDoc(id) {
  const snap = await adminDb.collection('bookings').doc(id).get();
  return snap.data();
}

async function expectBookingError(promise, code) {
  let error;
  try {
    await promise;
  } catch (caught) {
    error = caught;
  }
  if (!error) {
    throw new Error(`Expected ${code} but the call succeeded.`);
  }
  if (error.code !== code) {
    throw new Error(`Expected ${code} but received ${error.code || error.message}`);
  }
}

function baseBooking(packageId, departureId, travelers = 1) {
  return {
    customerId: customerUid,
    packageId,
    departureId,
    numberOfTravelers: travelers,
    customerName: 'Carlos Customer',
    customerEmail: 'customer@example.com',
    customerPhone: '09171234567',
  };
}

beforeAll(async () => {
  const app = getApps().length ? getApps()[0] : initializeApp({ projectId: PROJECT_ID });
  adminDb = getAdminFirestore(app);
  adminAuth = getAdminAuth(app);
  customerUid = await ensureUser(CUSTOMER, 'customer');
  adminUid = await ensureUser(ADMIN, 'admin');
});

describe('createBooking (against the emulator with Security Rules)', () => {
  it('creates a pending booking and reserves seats', async () => {
    const packageId = await seedPackage();
    const departureId = await seedDeparture({ capacity: 3 });

    await signInWithEmailAndPassword(auth, CUSTOMER.email, CUSTOMER.password);
    const result = await createBooking(baseBooking(packageId, departureId, 2));

    expect(result.bookingReference).toMatch(/^TTB-[A-Z0-9]{6}$/);
    expect(result.totalPrice).toBe(200000);
    expect(await bookedSeats(departureId)).toBe(2);

    const booking = await bookingDoc(result.id);
    expect(booking.bookingStatus).toBe('pending');
    expect(booking.paymentStatus).toBe('unpaid');
    expect(booking.totalPrice).toBe(200000);
  });

  it('prevents overbooking when capacity is exceeded', async () => {
    const packageId = await seedPackage();
    const departureId = await seedDeparture({ capacity: 3, bookedCount: 2 });

    await signInWithEmailAndPassword(auth, CUSTOMER.email, CUSTOMER.password);
    await expectBookingError(createBooking(baseBooking(packageId, departureId, 2)), 'INSUFFICIENT_SEATS');
    expect(await bookedSeats(departureId)).toBe(2);
  });

  it('rejects archived packages and closed or past departures', async () => {
    await signInWithEmailAndPassword(auth, CUSTOMER.email, CUSTOMER.password);

    const archivedPackage = await seedPackage({ isPublished: true, isArchived: true });
    const openDeparture = await seedDeparture();
    await expectBookingError(
      createBooking(baseBooking(archivedPackage, openDeparture, 1)),
      'PACKAGE_UNAVAILABLE'
    );

    const packageId = await seedPackage();
    const closedDeparture = await seedDeparture({ status: 'closed' });
    await expectBookingError(
      createBooking(baseBooking(packageId, closedDeparture, 1)),
      'DEPARTURE_CLOSED'
    );

    const pastDeparture = await seedDeparture({ daysAhead: -5 });
    await expectBookingError(
      createBooking(baseBooking(packageId, pastDeparture, 1)),
      'DEPARTURE_PAST'
    );
  });

  it('rejects an invalid traveler count before touching the database', async () => {
    await signInWithEmailAndPassword(auth, CUSTOMER.email, CUSTOMER.password);
    await expectBookingError(createBooking(baseBooking('pkg', 'dep', 0)), 'INVALID_TRAVELERS');
  });
});

describe('seat release transitions', () => {
  it('releases seats when a customer cancels', async () => {
    const packageId = await seedPackage();
    const departureId = await seedDeparture({ capacity: 3 });

    await signInWithEmailAndPassword(auth, CUSTOMER.email, CUSTOMER.password);
    const { id } = await createBooking(baseBooking(packageId, departureId, 2));
    expect(await bookedSeats(departureId)).toBe(2);

    await cancelBooking(id, customerUid, 'customer');
    expect(await bookedSeats(departureId)).toBe(0);
    expect((await bookingDoc(id)).bookingStatus).toBe('cancelled');
  });

  it('keeps seats reserved on confirm, then releases them on reject', async () => {
    const packageId = await seedPackage();
    const departureId = await seedDeparture({ capacity: 3 });

    await signInWithEmailAndPassword(auth, CUSTOMER.email, CUSTOMER.password);
    const { id } = await createBooking(baseBooking(packageId, departureId, 1));
    expect(await bookedSeats(departureId)).toBe(1);

    await signInWithEmailAndPassword(auth, ADMIN.email, ADMIN.password);
    await confirmBooking(id, adminUid);
    expect((await bookingDoc(id)).bookingStatus).toBe('confirmed');
    expect(await bookedSeats(departureId)).toBe(1);

    await rejectBooking(id, adminUid, 'Insufficient documents');
    expect((await bookingDoc(id)).bookingStatus).toBe('rejected');
    expect(await bookedSeats(departureId)).toBe(0);
  });

  it('prevents cancelling a rejected booking', async () => {
    const packageId = await seedPackage();
    const departureId = await seedDeparture({ capacity: 3 });

    await signInWithEmailAndPassword(auth, CUSTOMER.email, CUSTOMER.password);
    const { id } = await createBooking(baseBooking(packageId, departureId, 1));

    await signInWithEmailAndPassword(auth, ADMIN.email, ADMIN.password);
    await rejectBooking(id, adminUid, 'No');

    await signInWithEmailAndPassword(auth, CUSTOMER.email, CUSTOMER.password);
    await expectBookingError(cancelBooking(id, customerUid, 'customer'), 'INVALID_TRANSITION');
  });
});

describe('BookingError', () => {
  it('is a named Error subclass', () => {
    const error = new BookingError('X', 'boom');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('BookingError');
  });
});
