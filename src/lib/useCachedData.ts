import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getServerSnapshot, getSnapshot, setCache, subscribe } from "./cache";

export interface CachedResult<T> {
  // Cached value, or null when the cache is cold and the first fetch is still
  // running.
  data: T | null;
  // True only on a cold cache — i.e. there is genuinely nothing to render yet.
  // A warm cache revalidating in the background never sets this.
  loading: boolean;
  // Set when a fetch failed. With a warm cache the stale data keeps showing and
  // this is informational; with a cold cache it is the page's failure state.
  error: Error | null;
}

// Stale-while-revalidate data hook.
//
//  - Reads `key` from the localStorage-backed cache. If something is cached,
//    it is returned immediately and the page renders with no loading screen.
//  - On every mount it runs `fetcher` in the background, compares the result
//    with the cache, and updates the cache (and the UI) only when it changed.
//  - With a cold cache it reports `loading` until the first fetch resolves, so
//    the page can show a loading screen.
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
): CachedResult<T> {
  const subscribeFn = useCallback((listener: () => void) => subscribe(key, listener), [key]);
  const getSnapshotFn = useCallback(() => getSnapshot<T>(key), [key]);
  const data = useSyncExternalStore(subscribeFn, getSnapshotFn, getServerSnapshot);

  const [error, setError] = useState<Error | null>(null);
  // Whether a background fetch is currently in flight. Combined with `data`
  // below to derive `loading`.
  const [revalidating, setRevalidating] = useState(true);

  // Keep the latest fetcher without making it an effect dependency, so an
  // inline `() => fetch(...)` fetcher does not re-trigger the effect.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setRevalidating(true);

    fetcherRef
      .current()
      .then((fresh) => {
        if (cancelled) return;
        // setCache notifies subscribers (re-rendering this hook) only when the
        // value actually changed — a matching revalidation is a silent no-op.
        setCache(key, fresh);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setRevalidating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return { data, loading: data === null && revalidating, error };
}
