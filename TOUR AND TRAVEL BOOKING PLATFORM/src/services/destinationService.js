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

const COLLECTION = 'destinations';

export function destinationDocRef(id) {
  return doc(db, COLLECTION, id);
}

/** Public listing: published destinations, newest first. */
export function publishedDestinationsQuery() {
  return query(
    collection(db, COLLECTION),
    where('isPublished', '==', true),
    orderBy('createdAt', 'desc')
  );
}

/** Homepage featured destinations. */
export function featuredDestinationsQuery() {
  return query(
    collection(db, COLLECTION),
    where('isPublished', '==', true),
    where('isFeatured', '==', true),
    orderBy('createdAt', 'desc')
  );
}

/** Admin listing: every destination. */
export function allDestinationsQuery() {
  return query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
}

export async function getDestination(id) {
  const snapshot = await getDoc(destinationDocRef(id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

function buildPayload(values) {
  return {
    name: (values.name || '').trim(),
    country: (values.country || '').trim(),
    region: (values.region || '').trim(),
    location: (values.location || '').trim(),
    description: (values.description || '').trim(),
    imageUrls: Array.isArray(values.imageUrls) ? values.imageUrls.filter(Boolean) : [],
    category: values.category || 'beach',
    latitude: values.latitude === '' || values.latitude === undefined ? null : Number(values.latitude),
    longitude: values.longitude === '' || values.longitude === undefined ? null : Number(values.longitude),
    isPublished: Boolean(values.isPublished),
    isFeatured: Boolean(values.isFeatured),
    isArchived: Boolean(values.isArchived),
  };
}

export async function createDestination(values) {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...buildPayload(values),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDestination(id, values) {
  await updateDoc(destinationDocRef(id), {
    ...buildPayload(values),
    updatedAt: serverTimestamp(),
  });
}

export async function setDestinationPublished(id, isPublished) {
  await updateDoc(destinationDocRef(id), { isPublished, updatedAt: serverTimestamp() });
}

export async function setDestinationFeatured(id, isFeatured) {
  await updateDoc(destinationDocRef(id), { isFeatured, updatedAt: serverTimestamp() });
}

export async function archiveDestination(id) {
  await updateDoc(destinationDocRef(id), {
    isArchived: true,
    isPublished: false,
    isFeatured: false,
    updatedAt: serverTimestamp(),
  });
}

/** True when at least one tour package still references this destination. */
export async function isDestinationReferenced(destinationId) {
  const snapshot = await getDocs(
    query(collection(db, 'tourPackages'), where('destinationId', '==', destinationId), limit(1))
  );
  return !snapshot.empty;
}

export async function deleteDestination(id) {
  await deleteDoc(destinationDocRef(id));
}
