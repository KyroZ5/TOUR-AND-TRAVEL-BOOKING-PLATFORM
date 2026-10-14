import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

const COLLECTION = 'promotions';

export function promotionDocRef(id) {
  return doc(db, COLLECTION, id);
}

export function activePromotionsQuery() {
  return query(
    collection(db, COLLECTION),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
}

export function allPromotionsQuery() {
  return query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
}

export async function getPromotion(id) {
  const snapshot = await getDoc(promotionDocRef(id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

function toJsDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** True only when the promotion is active and the current date falls inside its window. */
export function isPromotionActive(promotion, now = new Date()) {
  if (!promotion || !promotion.isActive) {
    return false;
  }
  const start = toJsDate(promotion.startDate);
  const end = toJsDate(promotion.endDate);
  if (start && now < start) {
    return false;
  }
  if (end && now > end) {
    return false;
  }
  return true;
}

function buildPayload(values) {
  return {
    title: (values.title || '').trim(),
    description: (values.description || '').trim(),
    imageUrl: (values.imageUrl || '').trim(),
    discountType: values.discountType || 'percent',
    discountValue: Number(values.discountValue) || 0,
    applicablePackageIds: Array.isArray(values.applicablePackageIds)
      ? values.applicablePackageIds.filter(Boolean)
      : [],
    startDate: values.startDate || null,
    endDate: values.endDate || null,
    isActive: Boolean(values.isActive),
  };
}

export async function createPromotion(values) {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...buildPayload(values),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePromotion(id, values) {
  await updateDoc(promotionDocRef(id), {
    ...buildPayload(values),
    updatedAt: serverTimestamp(),
  });
}

export async function setPromotionActive(id, isActive) {
  await updateDoc(promotionDocRef(id), { isActive, updatedAt: serverTimestamp() });
}

export async function deletePromotion(id) {
  await deleteDoc(promotionDocRef(id));
}
