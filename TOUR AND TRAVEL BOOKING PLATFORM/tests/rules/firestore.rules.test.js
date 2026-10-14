import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-tour-travel';
const ADMIN = 'admin-1';
const CUSTOMER = 'cust-1';

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve('firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedUser(ADMIN, 'admin');
  await seedUser(CUSTOMER, 'customer');
});

function adminDb() {
  return testEnv.authenticatedContext(ADMIN).firestore();
}
function customerDb() {
  return testEnv.authenticatedContext(CUSTOMER).firestore();
}
function anonDb() {
  return testEnv.unauthenticatedContext().firestore();
}

async function seed(collectionName, id, data) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), collectionName, id), data);
  });
}

async function seedUser(uid, role, accountStatus = 'active') {
  await seed('users', uid, {
    uid,
    fullName: `Test ${role}`,
    email: `${uid}@example.com`,
    phone: '09171234567',
    role,
    accountStatus,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

const future = () => Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

describe('users', () => {
  it('denies anonymous reads', async () => {
    await assertFails(getDoc(doc(anonDb(), 'users', CUSTOMER)));
  });

  it('lets a customer read their own profile but not another user', async () => {
    await assertSucceeds(getDoc(doc(customerDb(), 'users', CUSTOMER)));
    await assertFails(getDoc(doc(customerDb(), 'users', ADMIN)));
  });

  it('lets an admin read any profile', async () => {
    await assertSucceeds(getDoc(doc(adminDb(), 'users', CUSTOMER)));
  });

  it('lets a new user self-register as a customer', async () => {
    const db = testEnv.authenticatedContext('newbie').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'users', 'newbie'), {
        uid: 'newbie',
        fullName: 'Newbie',
        email: 'newbie@example.com',
        phone: '09171234567',
        role: 'customer',
        accountStatus: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    );
  });

  it('rejects self-registration with an elevated role or mismatched uid', async () => {
    const db = testEnv.authenticatedContext('newbie').firestore();
    const base = {
      fullName: 'Newbie',
      email: 'newbie@example.com',
      phone: '09171234567',
      accountStatus: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await assertFails(setDoc(doc(db, 'users', 'newbie'), { ...base, uid: 'newbie', role: 'admin' }));
    await assertFails(
      setDoc(doc(db, 'users', 'someone-else'), { ...base, uid: 'newbie', role: 'customer' })
    );
  });

  it('lets a customer update their own contact info', async () => {
    await assertSucceeds(
      updateDoc(doc(customerDb(), 'users', CUSTOMER), { fullName: 'Updated Name' })
    );
  });

  it('prevents a customer from changing their role or status', async () => {
    await assertFails(updateDoc(doc(customerDb(), 'users', CUSTOMER), { role: 'admin' }));
    await assertFails(
      updateDoc(doc(customerDb(), 'users', CUSTOMER), { accountStatus: 'disabled' })
    );
  });

  it('lets an admin update and delete users', async () => {
    await assertSucceeds(updateDoc(doc(adminDb(), 'users', CUSTOMER), { role: 'admin' }));
    await assertSucceeds(deleteDoc(doc(adminDb(), 'users', CUSTOMER)));
  });

  it('prevents a customer from deleting users', async () => {
    await assertFails(deleteDoc(doc(customerDb(), 'users', CUSTOMER)));
  });
});

describe('destinations', () => {
  beforeEach(async () => {
    await seed('destinations', 'published', { name: 'Boracay', isPublished: true });
    await seed('destinations', 'draft', { name: 'Secret Spot', isPublished: false });
  });

  it('allows public reads of published destinations only', async () => {
    await assertSucceeds(getDoc(doc(anonDb(), 'destinations', 'published')));
    await assertFails(getDoc(doc(anonDb(), 'destinations', 'draft')));
  });

  it('only admins may write', async () => {
    await assertFails(
      setDoc(doc(customerDb(), 'destinations', 'x'), { name: 'X', isPublished: true })
    );
    await assertSucceeds(
      setDoc(doc(adminDb(), 'destinations', 'x'), { name: 'X', isPublished: true })
    );
  });
});

describe('tourPackages', () => {
  it('allows public reads of published packages only and admin-only writes', async () => {
    await seed('tourPackages', 'pub', { name: 'Pub', isPublished: true });
    await seed('tourPackages', 'hidden', { name: 'Hidden', isPublished: false });
    await assertSucceeds(getDoc(doc(anonDb(), 'tourPackages', 'pub')));
    await assertFails(getDoc(doc(anonDb(), 'tourPackages', 'hidden')));
    await assertFails(setDoc(doc(customerDb(), 'tourPackages', 'n'), { isPublished: true }));
    await assertSucceeds(setDoc(doc(adminDb(), 'tourPackages', 'n'), { isPublished: true }));
  });
});

describe('departures', () => {
  beforeEach(async () => {
    await seed('departures', 'dep-1', {
      packageId: 'pkg-1',
      departureDate: future(),
      capacity: 10,
      bookedCount: 2,
      status: 'open',
    });
  });

  it('is publicly readable', async () => {
    await assertSucceeds(getDoc(doc(anonDb(), 'departures', 'dep-1')));
  });

  it('only admins may create or delete', async () => {
    await assertFails(setDoc(doc(customerDb(), 'departures', 'd2'), { capacity: 5 }));
    await assertSucceeds(setDoc(doc(adminDb(), 'departures', 'd2'), { capacity: 5 }));
    await assertFails(deleteDoc(doc(customerDb(), 'departures', 'dep-1')));
    await assertSucceeds(deleteDoc(doc(adminDb(), 'departures', 'dep-1')));
  });

  it('lets an active customer reserve seats within capacity', async () => {
    await assertSucceeds(
      updateDoc(doc(customerDb(), 'departures', 'dep-1'), {
        bookedCount: 5,
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('lets an active customer release seats (booking cancellation)', async () => {
    await assertSucceeds(
      updateDoc(doc(customerDb(), 'departures', 'dep-1'), {
        bookedCount: 1,
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('blocks over-capacity, negative, and non-seat updates from customers', async () => {
    await assertFails(
      updateDoc(doc(customerDb(), 'departures', 'dep-1'), {
        bookedCount: 11,
        updatedAt: serverTimestamp(),
      })
    );
    await assertFails(
      updateDoc(doc(customerDb(), 'departures', 'dep-1'), {
        bookedCount: -1,
        updatedAt: serverTimestamp(),
      })
    );
    await assertFails(
      updateDoc(doc(customerDb(), 'departures', 'dep-1'), {
        capacity: 20,
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('lets admins update freely', async () => {
    await assertSucceeds(
      updateDoc(doc(adminDb(), 'departures', 'dep-1'), { capacity: 20, status: 'closed' })
    );
  });
});

describe('bookings', () => {
  const validBooking = () => ({
    bookingReference: 'TTB-ABC234',
    customerId: CUSTOMER,
    packageId: 'pkg-1',
    departureId: 'dep-1',
    packageName: 'Sample',
    departureDate: future(),
    returnDate: future(),
    customerName: 'Test Customer',
    customerEmail: 'cust-1@example.com',
    customerPhone: '09171234567',
    numberOfTravelers: 2,
    pricePerPerson: 1000,
    totalPrice: 2000,
    bookingStatus: 'pending',
    paymentStatus: 'unpaid',
    specialRequests: '',
    adminNotes: '',
    statusHistory: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  beforeEach(async () => {
    await seed('bookings', 'book-1', {
      customerId: CUSTOMER,
      bookingStatus: 'pending',
      paymentStatus: 'unpaid',
      numberOfTravelers: 2,
      pricePerPerson: 1000,
      totalPrice: 2000,
      statusHistory: [{ status: 'pending' }],
    });
  });

  it('lets a customer create a valid pending booking', async () => {
    await assertSucceeds(setDoc(doc(customerDb(), 'bookings', 'new'), validBooking()));
  });

  it('rejects bookings for another customer or a forged total', async () => {
    await assertFails(
      setDoc(doc(customerDb(), 'bookings', 'x1'), { ...validBooking(), customerId: 'someone-else' })
    );
    await assertFails(
      setDoc(doc(customerDb(), 'bookings', 'x2'), { ...validBooking(), totalPrice: 9999 })
    );
    await assertFails(
      setDoc(doc(customerDb(), 'bookings', 'x3'), { ...validBooking(), bookingStatus: 'confirmed' })
    );
  });

  it('scopes reads to owners and admins', async () => {
    await assertSucceeds(getDoc(doc(customerDb(), 'bookings', 'book-1')));
    await assertSucceeds(getDoc(doc(adminDb(), 'bookings', 'book-1')));

    await seed('bookings', 'book-2', { customerId: 'other', bookingStatus: 'pending' });
    await assertFails(getDoc(doc(customerDb(), 'bookings', 'book-2')));
  });

  it('lets a customer cancel their own pending booking only', async () => {
    await assertSucceeds(
      updateDoc(doc(customerDb(), 'bookings', 'book-1'), {
        bookingStatus: 'cancelled',
        statusHistory: [{ status: 'pending' }, { status: 'cancelled' }],
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('prevents customers from touching payment fields or deleting bookings', async () => {
    await assertFails(
      updateDoc(doc(customerDb(), 'bookings', 'book-1'), { paymentStatus: 'paid' })
    );
    await assertFails(deleteDoc(doc(customerDb(), 'bookings', 'book-1')));
    await assertFails(deleteDoc(doc(adminDb(), 'bookings', 'book-1')));
  });

  it('lets an admin update bookings', async () => {
    await assertSucceeds(
      updateDoc(doc(adminDb(), 'bookings', 'book-1'), { bookingStatus: 'confirmed' })
    );
  });
});

describe('payments', () => {
  const validPayment = () => ({
    bookingId: 'book-1',
    customerId: CUSTOMER,
    amount: 1000,
    paymentMethod: 'gcash',
    referenceNumber: '123456',
    receiptUrl: '',
    paymentStatus: 'pending_verification',
    verifiedBy: null,
    verifiedAt: null,
    createdAt: Timestamp.now(),
  });

  beforeEach(async () => {
    await seed('payments', 'pay-1', { customerId: CUSTOMER, amount: 1000, paymentStatus: 'paid' });
  });

  it('lets a customer submit a payment proof', async () => {
    await assertSucceeds(setDoc(doc(customerDb(), 'payments', 'new'), validPayment()));
  });

  it('rejects zero-amount or forged payments', async () => {
    await assertFails(setDoc(doc(customerDb(), 'payments', 'z'), { ...validPayment(), amount: 0 }));
    await assertFails(
      setDoc(doc(customerDb(), 'payments', 'y'), { ...validPayment(), customerId: 'other' })
    );
  });

  it('scopes reads to owners and admins', async () => {
    await assertSucceeds(getDoc(doc(customerDb(), 'payments', 'pay-1')));
    await assertSucceeds(getDoc(doc(adminDb(), 'payments', 'pay-1')));
    await seed('payments', 'pay-2', { customerId: 'other', amount: 1 });
    await assertFails(getDoc(doc(customerDb(), 'payments', 'pay-2')));
  });

  it('only admins may verify payments', async () => {
    await assertFails(updateDoc(doc(customerDb(), 'payments', 'pay-1'), { paymentStatus: 'paid' }));
    await assertSucceeds(
      updateDoc(doc(adminDb(), 'payments', 'pay-1'), { paymentStatus: 'paid', verifiedBy: ADMIN })
    );
  });
});

describe('notifications', () => {
  beforeEach(async () => {
    await seed('notifications', 'note-1', {
      userId: CUSTOMER,
      title: 'Hello',
      message: 'World',
      type: 'booking_submitted',
      isRead: false,
      relatedBookingId: null,
    });
  });

  it('lets a customer create only their own booking notifications', async () => {
    await assertSucceeds(
      setDoc(doc(customerDb(), 'notifications', 'n1'), {
        userId: CUSTOMER,
        title: 't',
        message: 'm',
        type: 'booking_submitted',
        isRead: false,
      })
    );
    await assertSucceeds(
      setDoc(doc(customerDb(), 'notifications', 'n3'), {
        userId: CUSTOMER,
        title: 't',
        message: 'm',
        type: 'booking_cancelled',
        isRead: false,
      })
    );
    await assertFails(
      setDoc(doc(customerDb(), 'notifications', 'n2'), {
        userId: CUSTOMER,
        title: 't',
        message: 'm',
        type: 'system',
        isRead: false,
      })
    );
  });

  it('scopes reads to owners and admins', async () => {
    await assertSucceeds(getDoc(doc(customerDb(), 'notifications', 'note-1')));
    await assertSucceeds(getDoc(doc(adminDb(), 'notifications', 'note-1')));
    await seed('notifications', 'note-2', { userId: 'other', isRead: false });
    await assertFails(getDoc(doc(customerDb(), 'notifications', 'note-2')));
  });

  it('lets an owner toggle isRead but not other fields', async () => {
    await assertSucceeds(updateDoc(doc(customerDb(), 'notifications', 'note-1'), { isRead: true }));
    await assertFails(
      updateDoc(doc(customerDb(), 'notifications', 'note-1'), { title: 'Hacked' })
    );
  });

  it('lets an owner delete their own notification', async () => {
    await assertSucceeds(deleteDoc(doc(customerDb(), 'notifications', 'note-1')));
  });
});

describe('promotions and settings', () => {
  it('is publicly readable but admin-only to write', async () => {
    await seed('promotions', 'promo-1', { title: 'Sale', isActive: true });
    await seed('settings', 'site', { agencyName: 'Wanderlust' });
    await assertSucceeds(getDoc(doc(anonDb(), 'promotions', 'promo-1')));
    await assertSucceeds(getDoc(doc(anonDb(), 'settings', 'site')));
    await assertFails(setDoc(doc(customerDb(), 'promotions', 'x'), { title: 'X' }));
    await assertFails(setDoc(doc(customerDb(), 'settings', 'x'), { agencyName: 'X' }));
    await assertSucceeds(setDoc(doc(adminDb(), 'promotions', 'x'), { title: 'X' }));
    await assertSucceeds(setDoc(doc(adminDb(), 'settings', 'x'), { agencyName: 'X' }));
  });
});

describe('activityLogs', () => {
  beforeEach(async () => {
    await seed('activityLogs', 'log-1', { action: 'seed', createdAt: Timestamp.now() });
  });

  it('is admin-only for reads and creates', async () => {
    await assertFails(getDoc(doc(customerDb(), 'activityLogs', 'log-1')));
    await assertSucceeds(getDoc(doc(adminDb(), 'activityLogs', 'log-1')));
    await assertFails(setDoc(doc(customerDb(), 'activityLogs', 'c'), { action: 'x' }));
    await assertSucceeds(setDoc(doc(adminDb(), 'activityLogs', 'c'), { action: 'x' }));
  });

  it('is immutable', async () => {
    await assertFails(updateDoc(doc(adminDb(), 'activityLogs', 'log-1'), { action: 'changed' }));
    await assertFails(deleteDoc(doc(adminDb(), 'activityLogs', 'log-1')));
  });
});
