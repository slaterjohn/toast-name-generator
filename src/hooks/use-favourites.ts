"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadFavourites,
  saveFavourites,
  toggleFavourite,
  type Favourite,
} from "@/lib/storage/favourites";

export function useFavourites() {
  const [favourites, setFavourites] = useState<Favourite[]>([]);

  useEffect(() => {
    setFavourites(loadFavourites());
    const onStorage = () => setFavourites(loadFavourites());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((fn: (list: Favourite[]) => Favourite[]) => {
    setFavourites((list) => {
      const next = fn(list);
      saveFavourites(next);
      return next;
    });
  }, []);

  const toggle = useCallback(
    (item: { id: string; display: string }) => update((list) => toggleFavourite(list, item)),
    [update],
  );
  const remove = useCallback((id: string) => update((list) => list.filter((f) => f.id !== id)), [update]);
  const clear = useCallback(() => update(() => []), [update]);
  const isFavourite = useCallback((id: string) => favourites.some((f) => f.id === id), [favourites]);

  return { favourites, toggle, remove, clear, isFavourite };
}
