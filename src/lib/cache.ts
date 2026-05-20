// Client-side data cache backing the stale-while-revalidate behaviour.
//
// Pages read whatever is stored here so a warm cache renders instantly; a
// background fetch then revalidates against the live API and pushes an update
// through `setCache` only when the data actually changed.
//
// The cache is exposed as an external store (subscribe / getSnapshot) so it can
// drive React's `useSyncExternalStore`. That hook tolerates the server snapshot
// (always empty — the server has no localStorage) differing from the client
// snapshot, so hydration stays clean without a mismatch warning.

type Listener = () => void;

const PREFIX = "fst-cache:";

// Parsed value per key. `useSyncExternalStore` requires getSnapshot to return a
// stable reference between renders, so we parse localStorage exactly once per
// key and only swap the reference when the data genuinely changes.
const snapshots = new Map<string, unknown>();
const loaded = new Set<string>();
const listeners = new Map<string, Set<Listener>>();

function notify(key: string): void {
  listeners.get(key)?.forEach((listener) => listener());
}

export function subscribe(key: string, listener: Listener): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
  };
}

// Current cached value for a key. The first call hydrates it from localStorage;
// later calls return the same reference until `setCache` replaces it.
export function getSnapshot<T>(key: string): T | null {
  if (!loaded.has(key)) {
    loaded.add(key);
    let value: T | null = null;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(PREFIX + key);
        if (raw) value = JSON.parse(raw) as T;
      } catch {
        value = null; // corrupt entry or localStorage unavailable
      }
    }
    snapshots.set(key, value);
  }
  return (snapshots.get(key) ?? null) as T | null;
}

// The server has no localStorage, so it always starts from an empty cache.
export function getServerSnapshot(): null {
  return null;
}

// Store a freshly fetched value. Returns true when it differed from what was
// cached — letting the caller distinguish a real update from a no-op
// revalidation (in which case nothing re-renders).
export function setCache<T>(key: string, value: T): boolean {
  const previous = getSnapshot<T>(key);
  if (JSON.stringify(previous) === JSON.stringify(value)) return false;

  snapshots.set(key, value);
  loaded.add(key);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Quota exceeded or unavailable — the in-memory snapshot still serves
      // this session, so the page keeps working.
    }
  }
  notify(key);
  return true;
}
