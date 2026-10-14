import { useEffect, useRef, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';

/**
 * Subscribes to a Firestore query (built by the caller, ideally with useMemo) and keeps
 * the returned documents in sync. Pass `null` to disable the subscription.
 *
 * Uses stale-while-revalidate: once data has been received, a re-subscription keeps the
 * previous data on screen instead of flashing skeletons and remounting the view.
 *
 * @param {import('firebase/firestore').Query|null} queryInstance
 * @returns {{ data: Array, loading: boolean, error: Error|null }}
 */
export function useCollection(queryInstance) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(Boolean(queryInstance));
  const [error, setError] = useState(null);
  const hasDataRef = useRef(false);

  useEffect(() => {
    if (!queryInstance) {
      setData([]);
      setLoading(false);
      setError(null);
      hasDataRef.current = false;
      return undefined;
    }

    // Only show the loading skeleton when there is nothing on screen yet. This stops a
    // re-subscription from swapping rendered cards for skeletons (and re-downloading images).
    if (!hasDataRef.current) {
      setLoading(true);
    }

    const unsubscribe = onSnapshot(
      queryInstance,
      (snapshot) => {
        setData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        hasDataRef.current = true;
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [queryInstance]);

  return { data, loading, error };
}

/**
 * Subscribes to a single Firestore document reference (or null when disabled).
 *
 * Same stale-while-revalidate behaviour as useCollection.
 *
 * @param {import('firebase/firestore').DocumentReference|null} docRef
 * @returns {{ data: Object|null, loading: boolean, error: Error|null }}
 */
export function useDocument(docRef) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(docRef));
  const [error, setError] = useState(null);
  const hasDataRef = useRef(false);

  useEffect(() => {
    if (!docRef) {
      setData(null);
      setLoading(false);
      setError(null);
      hasDataRef.current = false;
      return undefined;
    }

    if (!hasDataRef.current) {
      setLoading(true);
    }

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        hasDataRef.current = true;
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [docRef]);

  return { data, loading, error };
}

export default useCollection;
