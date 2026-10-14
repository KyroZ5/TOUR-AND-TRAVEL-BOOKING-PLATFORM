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
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase.js';
import { toCentavos } from '../utils/currency.js';

const COLLECTION = 'tourPackages';

export function packageDocRef(id) {
  return doc(db, COLLECTION, id);
}

export function publishedPackagesQuery() {
  return query(
    collection(db, COLLECTION),
    where('isPublished', '==', true),
    orderBy('createdAt', 'desc')
  );
}

export function featuredPackagesQuery() {
  return query(
    collection(db, COLLECTION),
    where('isPublished', '==', true),
    where('isFeatured', '==', true),
    orderBy('createdAt', 'desc')
  );
}

export function packagesByDestinationQuery(destinationId) {
  return query(
    collection(db, COLLECTION),
    where('isPublished', '==', true),
    where('destinationId', '==', destinationId),
    orderBy('createdAt', 'desc')
  );
}

export function allPackagesQuery() {
  return query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
}

export async function getPackage(id) {
  const snapshot = await getDoc(packageDocRef(id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

/** Names of packages that reference a destination (used for safe deletes). */
export async function findPackagesByDestination(destinationId) {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), where('destinationId', '==', destinationId), limit(5))
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function normalizeItinerary(itinerary) {
  if (!Array.isArray(itinerary)) {
    return [];
  }
  return itinerary
    .filter((item) => item && (item.title || item.details))
    .map((item, index) => ({
      day: Number(item.day) || index + 1,
      title: (item.title || '').trim(),
      details: (item.details || '').trim(),
    }))
    .sort((a, b) => a.day - b.day);
}

/**
 * Package payload. `pricePerPerson` provided by the form is in PESOS and is
 * converted to integer centavos for storage.
 */
function buildPayload(values) {
  return {
    name: (values.name || '').trim(),
    destinationId: values.destinationId || '',
    description: (values.description || '').trim(),
    category: values.category || 'island',
    pricePerPerson: toCentavos(values.pricePerPerson),
    durationDays: Number(values.durationDays) || 1,
    durationNights: Number(values.durationNights) || 0,
    itinerary: normalizeItinerary(values.itinerary),
    inclusions: Array.isArray(values.inclusions) ? values.inclusions.filter(Boolean) : [],
    exclusions: Array.isArray(values.exclusions) ? values.exclusions.filter(Boolean) : [],
    imageUrls: Array.isArray(values.imageUrls) ? values.imageUrls.filter(Boolean) : [],
    accommodation: (values.accommodation || '').trim(),
    transportation: (values.transportation || '').trim(),
    cancellationPolicy: (values.cancellationPolicy || '').trim(),
    travelReminders: (values.travelReminders || '').trim(),
    isPublished: Boolean(values.isPublished),
    isFeatured: Boolean(values.isFeatured),
    isArchived: Boolean(values.isArchived),
    promotionId: values.promotionId || null,
  };
}

export async function createPackage(values) {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...buildPayload(values),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePackage(id, values) {
  await updateDoc(packageDocRef(id), {
    ...buildPayload(values),
    updatedAt: serverTimestamp(),
  });
}

export async function setPackagePublished(id, isPublished) {
  await updateDoc(packageDocRef(id), { isPublished, updatedAt: serverTimestamp() });
}

export async function setPackageFeatured(id, isFeatured) {
  await updateDoc(packageDocRef(id), { isFeatured, updatedAt: serverTimestamp() });
}

export async function archivePackage(id) {
  await updateDoc(packageDocRef(id), {
    isArchived: true,
    isPublished: false,
    isFeatured: false,
    updatedAt: serverTimestamp(),
  });
}

/** True when a booking references this package (blocks hard delete). */
export async function isPackageReferenced(packageId) {
  const snapshot = await getDocs(
    query(collection(db, 'bookings'), where('packageId', '==', packageId), limit(1))
  );
  return !snapshot.empty;
}

export async function deletePackage(id) {
  await deleteDoc(packageDocRef(id));
}
