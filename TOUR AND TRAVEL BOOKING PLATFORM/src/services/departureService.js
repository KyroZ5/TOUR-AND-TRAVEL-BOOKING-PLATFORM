import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

const COLLECTION = 'departures';

export function departureDocRef(id) {
  return doc(db, COLLECTION, id);
}

/** Open departures for a package (public booking options). */
export function openDeparturesQuery(packageId) {
  return query(
    collection(db, COLLECTION),
    where('packageId', '==', packageId),
    where('status', '==', 'open'),
    orderBy('departureDate', 'asc')
  );
}

/** All departures for a package (admin). */
export function departuresByPackageQuery(packageId) {
  return query(
    collection(db, COLLECTION),
    where('packageId', '==', packageId),
    orderBy('departureDate', 'asc')
  );
}

export function allDeparturesQuery() {
  return query(collection(db, COLLECTION), orderBy('departureDate', 'asc'));
}

export async function getDeparture(id) {
  const snapshot = await getDoc(departureDocRef(id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

/** Departures for many packages (admin overview / reports). */
export async function getDeparturesByPackageIds(packageIds) {
  if (!packageIds || packageIds.length === 0) {
    return [];
  }
  const results = [];
  // Firestore `in` supports up to 30 values.
  for (let i = 0; i < packageIds.length; i += 30) {
    const chunk = packageIds.slice(i, i + 30);
    const snapshot = await getDocs(
      query(collection(db, COLLECTION), where('packageId', 'in', chunk))
    );
    snapshot.forEach((d) => results.push({ id: d.id, ...d.data() }));
  }
  return results;
}

function buildPayload(values) {
  return {
    packageId: values.packageId || '',
    departureDate: values.departureDate || null,
    returnDate: values.returnDate || null,
    capacity: Number(values.capacity) || 1,
    bookedCount: Number(values.bookedCount) || 0,
    status: values.status || 'open',
  };
}

export async function createDeparture(values) {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...buildPayload(values),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDeparture(id, values) {
  await updateDoc(departureDocRef(id), {
    ...buildPayload(values),
    updatedAt: serverTimestamp(),
  });
}

export async function setDepartureStatus(id, status) {
  await updateDoc(departureDocRef(id), { status, updatedAt: serverTimestamp() });
}

export async function deleteDeparture(id) {
  await deleteDoc(departureDocRef(id));
}

/** Remaining seats, clamped at zero. */
export function remainingSlots(departure) {
  if (!departure) {
    return 0;
  }
  const capacity = Number(departure.capacity) || 0;
  const booked = Number(departure.bookedCount) || 0;
  return Math.max(0, capacity - booked);
}
