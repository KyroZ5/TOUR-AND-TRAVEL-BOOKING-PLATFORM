import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

const COLLECTION = 'notifications';

export function notificationDocRef(id) {
  return doc(db, COLLECTION, id);
}

export function notificationsByUserQuery(userId) {
  return query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
}

/** Creates a notification document. Customers may only create `booking_submitted`. */
export async function createNotification({
  userId,
  title,
  message,
  type = 'system',
  relatedBookingId = null,
}) {
  const ref = await addDoc(collection(db, COLLECTION), {
    userId,
    title,
    message,
    type,
    isRead: false,
    relatedBookingId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function markNotificationRead(id, isRead = true) {
  await updateDoc(notificationDocRef(id), { isRead });
}

export async function markAllNotificationsRead(notifications) {
  const unread = notifications.filter((item) => !item.isRead);
  await Promise.all(unread.map((item) => markNotificationRead(item.id, true)));
}

export async function deleteNotification(id) {
  await deleteDoc(notificationDocRef(id));
}

export async function countUnreadNotifications(userId) {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('isRead', '==', false),
      limit(50)
    )
  );
  return snapshot.size;
}

export { Timestamp };
