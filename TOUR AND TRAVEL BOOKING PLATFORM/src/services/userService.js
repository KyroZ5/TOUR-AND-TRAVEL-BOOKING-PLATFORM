import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

/** Returns the profile document for a user id, or null. */
export async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

/**
 * Updates the fields a customer is permitted to change on their own profile.
 * Role and accountStatus are intentionally excluded; Security Rules also block
 * customers from changing those fields.
 */
export async function updateUserProfile(uid, values) {
  const allowed = {};
  if (typeof values.fullName === 'string') {
    allowed.fullName = values.fullName.trim();
  }
  if (typeof values.phone === 'string') {
    allowed.phone = values.phone.trim();
  }
  if (Object.keys(allowed).length === 0) {
    return;
  }
  await updateDoc(doc(db, 'users', uid), {
    ...allowed,
    updatedAt: serverTimestamp(),
  });
}

/** Admin: change a customer account status field (active|disabled). */
export async function setAccountStatus(uid, accountStatus) {
  await updateDoc(doc(db, 'users', uid), {
    accountStatus,
    updatedAt: serverTimestamp(),
  });
}

/** Base query for the customer management table (role == customer). */
export function customersQuery() {
  return query(
    collection(db, 'users'),
    where('role', '==', 'customer'),
    orderBy('createdAt', 'desc')
  );
}
