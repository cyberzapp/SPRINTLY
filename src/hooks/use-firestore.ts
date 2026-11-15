"use client";

import { useEffect, useState } from "react";
import { onSnapshot, type DocumentReference, type Query } from "firebase/firestore";
import { withId } from "@/lib/firebase/firestore";

export interface CollectionState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  /** True when the latest snapshot came from the local cache (offline / pending). */
  fromCache: boolean;
}

/**
 * Subscribe to a Firestore query. Pass a stable `key` that changes whenever
 * the query semantics change; the listener is torn down on unmount or key
 * change, so there are never duplicate subscriptions for the same component.
 */
export function useCollection<T>(query: Query | null, key: string): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({ data: [], loading: !!query, error: null, fromCache: false });

  useEffect(() => {
    if (!query) {
      setState({ data: [], loading: false, error: null, fromCache: false });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = onSnapshot(
      query,
      { includeMetadataChanges: false },
      (snap) => {
        setState({
          data: snap.docs.map((d) => withId<T>(d)),
          loading: false,
          error: null,
          fromCache: snap.metadata.fromCache,
        });
      },
      (error) => {
        console.warn(`[Sprintly] listener error (${key})`, error);
        setState({ data: [], loading: false, error, fromCache: false });
      },
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures query identity
  }, [key]);

  return state;
}

export interface DocumentState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  exists: boolean;
}

export function useDocument<T>(ref: DocumentReference | null, key: string): DocumentState<T> {
  const [state, setState] = useState<DocumentState<T>>({ data: null, loading: !!ref, error: null, exists: false });

  useEffect(() => {
    if (!ref) {
      setState({ data: null, loading: false, error: null, exists: false });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setState({
          data: snap.exists() ? withId<T>(snap) : null,
          loading: false,
          error: null,
          exists: snap.exists(),
        });
      },
      (error) => {
        console.warn(`[Sprintly] document listener error (${key})`, error);
        setState({ data: null, loading: false, error, exists: false });
      },
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures ref identity
  }, [key]);

  return state;
}
