import {
  collection,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/firebase.js';
import { generateBookingReference } from '../utils/bookingRef.js';
import { createNotification } from './notificationService.js';

const COLLECTION = 'bookings';
const DEPARTURES = 'departures';
const PACKAGES = 'tourPackages';

export class BookingError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'BookingError';
    this.code = code;
  }
}

export function bookingDocRef(id) {
  return doc(db, COLLECTION, id);
}

export function bookingsByCustomerQuery(customerId) {
  return query(
    collection(db, COLLECTION),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
}

export function allBookingsQuery() {
  return query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
}

export function bookingsByStatusQuery(status) {
  return query(
    collection(db, COLLECTION),
    where('bookingStatus', '==', status),
    orderBy('createdAt', 'desc')
  );
}

export async function getBooking(id) {
  const snapshot = await getDoc(bookingDocRef(id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

// Booking references are display-only (never used as a Firestore key). The
// 6-character code from a 32-symbol alphabet gives ~1.07 billion combinations,
// so collisions are negligible. We deliberately avoid an unscoped
// `where('bookingReference','==',...)` query here: Security Rules only allow
// users to read their own bookings, so Firestore would reject that query.
function generateUniqueReference() {
  return generateBookingReference();
}

function toJsDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function appendHistory(existing, entry) {
  const history = Array.isArray(existing) ? existing.slice() : [];
  history.push(entry);
  return history;
}

/**
 * Creates a booking inside a Firestore transaction.
 *
 * Guarantees:
 * - Package must be published, departure open and in the future.
 * - Seats are re-read and validated inside the transaction (prevents overbooking).
 * - Price is recalculated from the trusted package document (price snapshot).
 * - A pending booking reserves seats (bookedCount increments).
 */
export async function createBooking({
  customerId,
  packageId,
  departureId,
  numberOfTravelers,
  customerName,
  customerEmail,
  customerPhone,
  specialRequests = '',
}) {
  const travelers = Number(numberOfTravelers);
  if (!Number.isInteger(travelers) || travelers < 1) {
    throw new BookingError('INVALID_TRAVELERS', 'Enter at least one traveler.');
  }
  if (!customerId || !packageId || !departureId) {
    throw new BookingError('MISSING_FIELDS', 'The booking request is incomplete.');
  }

  const bookingReference = await generateUniqueReference();

  const result = await runTransaction(db, async (transaction) => {
    const departureRef = doc(db, DEPARTURES, departureId);
    const packageRef = doc(db, PACKAGES, packageId);

    const [departureSnapshot, packageSnapshot] = await Promise.all([
      transaction.get(departureRef),
      transaction.get(packageRef),
    ]);

    if (!departureSnapshot.exists()) {
      throw new BookingError('DEPARTURE_NOT_FOUND', 'The selected departure no longer exists.');
    }
    if (!packageSnapshot.exists()) {
      throw new BookingError('PACKAGE_NOT_FOUND', 'The selected tour package no longer exists.');
    }

    const departure = departureSnapshot.data();
    const pkg = packageSnapshot.data();

    if (!pkg.isPublished || pkg.isArchived) {
      throw new BookingError('PACKAGE_UNAVAILABLE', 'This tour package is not open for booking.');
    }
    if (departure.status !== 'open') {
      throw new BookingError('DEPARTURE_CLOSED', 'This departure is not open for booking.');
    }

    const departureDate = toJsDate(departure.departureDate);
    if (!departureDate || departureDate.getTime() <= Date.now()) {
      throw new BookingError('DEPARTURE_PAST', 'This departure date has already passed.');
    }

    const capacity = Number(departure.capacity) || 0;
    const booked = Number(departure.bookedCount) || 0;
    const seatsLeft = capacity - booked;
    if (seatsLeft < travelers) {
      throw new BookingError(
        'INSUFFICIENT_SEATS',
        seatsLeft > 0
          ? `Only ${seatsLeft} seat(s) remain for this departure.`
          : 'This departure is fully booked.'
      );
    }

    const pricePerPerson = Number(pkg.pricePerPerson) || 0;
    const totalPrice = pricePerPerson * travelers;

    const bookingRef = doc(collection(db, COLLECTION));
    transaction.set(bookingRef, {
      bookingReference,
      customerId,
      packageId,
      departureId,
      packageName: pkg.name || '',
      departureDate: departure.departureDate || null,
      returnDate: departure.returnDate || null,
      customerName: (customerName || '').trim(),
      customerEmail: (customerEmail || '').trim(),
      customerPhone: (customerPhone || '').trim(),
      numberOfTravelers: travelers,
      pricePerPerson,
      totalPrice,
      bookingStatus: 'pending',
      paymentStatus: 'unpaid',
      specialRequests: (specialRequests || '').trim(),
      adminNotes: '',
      statusHistory: [
        { status: 'pending', at: Timestamp.now(), by: customerId, note: 'Booking created' },
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(departureRef, {
      bookedCount: booked + travelers,
      updatedAt: serverTimestamp(),
    });

    return { id: bookingRef.id, bookingReference, totalPrice, pricePerPerson, travelers };
  });

  // Booking notification for the customer (best-effort, non-blocking).
  try {
    await createNotification({
      userId: customerId,
      title: 'Booking submitted',
      message: `We received your booking ${result.bookingReference}. Our team will review and confirm it shortly.`,
      type: 'booking_submitted',
      relatedBookingId: result.id,
    });
  } catch (error) {
    // Notification failures must not fail the booking itself.
  }

  return result;
}

async function releaseSeats(transaction, departureId, travelers) {
  const departureRef = doc(db, DEPARTURES, departureId);
  const snapshot = await transaction.get(departureRef);
  if (!snapshot.exists()) {
    return;
  }
  const current = Number(snapshot.data().bookedCount) || 0;
  transaction.update(departureRef, {
    bookedCount: Math.max(0, current - travelers),
    updatedAt: serverTimestamp(),
  });
}

/** Admin: confirm a pending booking (seats stay reserved). */
export async function confirmBooking(bookingId, actorUid) {
  const ref = bookingDocRef(bookingId);
  const result = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      throw new BookingError('NOT_FOUND', 'Booking not found.');
    }
    const booking = snapshot.data();
    if (!['pending'].includes(booking.bookingStatus)) {
      throw new BookingError('INVALID_TRANSITION', 'Only pending bookings can be confirmed.');
    }
    transaction.update(ref, {
      bookingStatus: 'confirmed',
      statusHistory: appendHistory(booking.statusHistory, {
        status: 'confirmed',
        at: Timestamp.now(),
        by: actorUid,
      }),
      updatedAt: serverTimestamp(),
    });
    return { customerId: booking.customerId, bookingReference: booking.bookingReference };
  });

  try {
    await createNotification({
      userId: result.customerId,
      title: 'Booking confirmed',
      message: `Your booking ${result.bookingReference} has been confirmed. Get ready for your trip!`,
      type: 'booking_confirmed',
      relatedBookingId: bookingId,
    });
  } catch (error) {
    // Non-fatal.
  }
}

/** Admin: reject a booking and release its reserved seats. */
export async function rejectBooking(bookingId, actorUid, reason = '') {
  const ref = bookingDocRef(bookingId);
  const result = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      throw new BookingError('NOT_FOUND', 'Booking not found.');
    }
    const booking = snapshot.data();
    if (!['pending', 'confirmed'].includes(booking.bookingStatus)) {
      throw new BookingError('INVALID_TRANSITION', 'This booking can no longer be rejected.');
    }
    await releaseSeats(transaction, booking.departureId, booking.numberOfTravelers);
    transaction.update(ref, {
      bookingStatus: 'rejected',
      statusHistory: appendHistory(booking.statusHistory, {
        status: 'rejected',
        at: Timestamp.now(),
        by: actorUid,
        note: reason,
      }),
      updatedAt: serverTimestamp(),
    });
    return { customerId: booking.customerId, bookingReference: booking.bookingReference };
  });

  try {
    await createNotification({
      userId: result.customerId,
      title: 'Booking rejected',
      message: `Your booking ${result.bookingReference} was not approved.${
        reason ? ` Reason: ${reason}.` : ''
      }`,
      type: 'booking_rejected',
      relatedBookingId: bookingId,
    });
  } catch (error) {
    // Non-fatal.
  }
}

/** Admin: mark a booking as completed (trip finished). */
export async function completeBooking(bookingId, actorUid) {
  const ref = bookingDocRef(bookingId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      throw new BookingError('NOT_FOUND', 'Booking not found.');
    }
    const booking = snapshot.data();
    if (booking.bookingStatus !== 'confirmed') {
      throw new BookingError('INVALID_TRANSITION', 'Only confirmed bookings can be completed.');
    }
    transaction.update(ref, {
      bookingStatus: 'completed',
      statusHistory: appendHistory(booking.statusHistory, {
        status: 'completed',
        at: Timestamp.now(),
        by: actorUid,
      }),
      updatedAt: serverTimestamp(),
    });
  });
}

/** Whether a booking may still be cancelled by the customer. */
export function canCancelBooking(booking, departure, minDays = 7) {
  if (!booking) {
    return false;
  }
  if (!['pending', 'confirmed'].includes(booking.bookingStatus)) {
    return false;
  }
  const date = toJsDate(departure && departure.departureDate);
  if (!date) {
    return false;
  }
  const msPerDay = 24 * 60 * 60 * 1000;
  return date.getTime() - Date.now() >= minDays * msPerDay;
}

/** Customer or admin: cancel a booking and release reserved seats. */
export async function cancelBooking(bookingId, actorUid, actorRole = 'customer') {
  const ref = bookingDocRef(bookingId);
  const result = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      throw new BookingError('NOT_FOUND', 'Booking not found.');
    }
    const booking = snapshot.data();
    if (!['pending', 'confirmed'].includes(booking.bookingStatus)) {
      throw new BookingError('INVALID_TRANSITION', 'This booking can no longer be cancelled.');
    }
    await releaseSeats(transaction, booking.departureId, booking.numberOfTravelers);
    transaction.update(ref, {
      bookingStatus: 'cancelled',
      statusHistory: appendHistory(booking.statusHistory, {
        status: 'cancelled',
        at: Timestamp.now(),
        by: actorUid,
        note: actorRole === 'admin' ? 'Cancelled by administrator' : 'Cancelled by customer',
      }),
      updatedAt: serverTimestamp(),
    });
    return { customerId: booking.customerId, bookingReference: booking.bookingReference };
  });

  try {
    await createNotification({
      userId: result.customerId,
      title: 'Booking cancelled',
      message: `Booking ${result.bookingReference} has been cancelled and any reserved seats were released.`,
      type: 'booking_cancelled',
      relatedBookingId: bookingId,
    });
  } catch (error) {
    // Non-fatal.
  }
}

/** Admin: update permitted booking fields (contact info and internal notes). */
export async function updateBookingAdmin(bookingId, values) {
  const payload = {};
  if (typeof values.customerName === 'string') payload.customerName = values.customerName.trim();
  if (typeof values.customerEmail === 'string') payload.customerEmail = values.customerEmail.trim();
  if (typeof values.customerPhone === 'string') payload.customerPhone = values.customerPhone.trim();
  if (typeof values.adminNotes === 'string') payload.adminNotes = values.adminNotes.trim();
  if (typeof values.specialRequests === 'string') payload.specialRequests = values.specialRequests.trim();

  if (Object.keys(payload).length === 0) {
    return;
  }
  await updateDoc(bookingDocRef(bookingId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}
