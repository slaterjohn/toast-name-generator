import { readJson, writeJson } from "./safe-storage";

/**
 * Favourites live in localStorage on this device only. Only generated names
 * are stored, never anything a person typed.
 */
export const FAVOURITES_KEY = "toast-name-generator:favourites:v1";
export const MAX_FAVOURITES = 200;

export interface Favourite {
  /** Canonical generated-name ID. */
  id: string;
  display: string;
  savedAt: number;
}

function isFavourite(x: unknown): x is Favourite {
  if (!x || typeof x !== "object") return false;
  const f = x as Favourite;
  return typeof f.id === "string" && typeof f.display === "string" && typeof f.savedAt === "number";
}

export function loadFavourites(): Favourite[] {
  const raw = readJson("local", FAVOURITES_KEY);
  return Array.isArray(raw) ? raw.filter(isFavourite).slice(0, MAX_FAVOURITES) : [];
}

export function saveFavourites(list: Favourite[]): boolean {
  return writeJson("local", FAVOURITES_KEY, list.slice(0, MAX_FAVOURITES));
}

/** Newest first. Adds if absent, removes if present. */
export function toggleFavourite(list: Favourite[], item: Omit<Favourite, "savedAt">, now = Date.now()): Favourite[] {
  if (list.some((f) => f.id === item.id)) return list.filter((f) => f.id !== item.id);
  return [{ ...item, savedAt: now }, ...list].slice(0, MAX_FAVOURITES);
}
