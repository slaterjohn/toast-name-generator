/**
 * Web Storage access that never throws (private windows, disabled storage,
 * quota errors, server rendering). Returns null / false on failure.
 */
type Area = "local" | "session";

function area(which: Area): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return which === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readJson(which: Area, key: string): unknown {
  try {
    const raw = area(which)?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeJson(which: Area, key: string, value: unknown): boolean {
  try {
    const store = area(which);
    if (!store) return false;
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(which: Area, key: string): void {
  try {
    area(which)?.removeItem(key);
  } catch {
    // ignore
  }
}
