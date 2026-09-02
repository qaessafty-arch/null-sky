// src/hooks/useFirestore.ts - Safe Firestore document and collection hooks with automatic cleanup
import { useState, useEffect } from 'react';
import { 
  doc, 
  collection, 
  onSnapshot, 
  DocumentData, 
  Query, 
  DocumentReference 
} from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestoreDocument<T = DocumentData>(collectionName: string, docId: string | null | undefined) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef: DocumentReference = doc(db, collectionName, docId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as unknown as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error(`[useFirestoreDocument] Error listening to ${collectionName}/${docId}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [collectionName, docId]);

  return { data, loading, error };
}

export function useFirestoreQuery<T = DocumentData>(queryRef: Query | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!queryRef) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      queryRef,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
        });
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error('[useFirestoreQuery] Error listening to query:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [queryRef]);

  return { data, loading, error };
}
