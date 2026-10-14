import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

const COLLECTION = 'activityLogs';

export function activityLogsQuery(max = 200) {
  return query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(max));
}

/**
 * Records an administrative action. In production this should be written from
 * a trusted Cloud Function; the Security Rules restrict writes to admins and
 * make the collection immutable (no update/delete).
 */
export async function logActivity({ actorUid, action, targetType, targetId, metadata = {} }) {
  await addDoc(collection(db, COLLECTION), {
    actorUid,
    action,
    targetType,
    targetId: targetId || '',
    metadata,
    createdAt: serverTimestamp(),
  });
}

export async function getRecentActivity(max = 200) {
  const snapshot = await getDocs(activityLogsQuery(max));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
