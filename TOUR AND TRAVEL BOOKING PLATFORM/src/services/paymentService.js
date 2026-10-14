import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

const COLLECTION = 'payments';

export function paymentDocRef(id) {
  return doc(db, COLLECTION, id);
}

export function paymentsByBookingQuery(bookingId) {
  return query(
    collection(db, COLLECTION),
    where('bookingId', '==', bookingId),
    orderBy('createdAt', 'desc')
  );
}

export function paymentsByCustomerQuery(customerId) {
  return query(
    collection(db, COLLECTION),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
}

export function allPaymentsQuery() {
  return query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
}

export async function getPayment(id) {
  const snapshot = await getDoc(paymentDocRef(id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function getPaymentsForBooking(bookingId) {
  const snapshot = await getDocs(paymentsByBookingQuery(bookingId));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Customer submits a manual payment proof. Never marks the booking as paid -
 * an administrator must verify it.
 */
export async function submitPayment({
  bookingId,
  customerId,
  amount,
  paymentMethod,
  referenceNumber,
  receiptUrl = '',
}) {
  const ref = await addDoc(collection(db, COLLECTION), {
    bookingId,
    customerId,
    amount: Math.round(Number(amount)),
    paymentMethod: paymentMethod || 'other',
    referenceNumber: (referenceNumber || '').trim(),
    receiptUrl,
    paymentStatus: 'pending_verification',
    verifiedBy: null,
    verifiedAt: null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Admin verifies a payment. Only this action may mark a booking's payment as
 * paid (or partially paid).
 */
export async function verifyPayment(paymentId, adminUid, { approved, bookingId, amount, totalPrice }) {
  const status = approved ? 'paid' : 'rejected';
  await updateDoc(paymentDocRef(paymentId), {
    paymentStatus: approved ? 'paid' : 'rejected',
    verifiedBy: adminUid,
    verifiedAt: Timestamp.now(),
  });

  if (!approved || !bookingId) {
    return;
  }

  // Reflect the payment status on the booking without ever exceeding "paid".
  const paidSoFar = await sumVerifiedPayments(bookingId);
  let bookingPaymentStatus = 'pending_verification';
  if (totalPrice && paidSoFar >= totalPrice) {
    bookingPaymentStatus = 'paid';
  } else if (paidSoFar > 0) {
    bookingPaymentStatus = 'partially_paid';
  }

  await updateDoc(doc(db, 'bookings', bookingId), {
    paymentStatus: bookingPaymentStatus,
    updatedAt: serverTimestamp(),
  });
}

/** Sum of amounts for this booking's verified payments. */
export async function sumVerifiedPayments(bookingId) {
  const snapshot = await getDocs(paymentsByBookingQuery(bookingId));
  return snapshot.docs
    .map((d) => d.data())
    .filter((p) => p.paymentStatus === 'paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
}
