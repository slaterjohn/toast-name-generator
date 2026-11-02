"use client";

import { Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Favourite } from "@/lib/storage/favourites";
import { CopyNameButton, type CopyOutcome } from "./copy-name-button";

interface Props {
  favourites: Favourite[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onCopyResult: (outcome: CopyOutcome, text: string) => void;
}

export default function FavouritesPanel({ favourites, onRemove, onClear, onCopyResult }: Props) {
  return (
    <section
      aria-labelledby="favourites-heading"
      className="w-full rounded-md border border-rule bg-card/80 p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="favourites-heading" className="font-display text-xl font-bold text-ink">
          Your favourites
        </h2>
        {favourites.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-11 px-3 text-ink-soft hover:text-ink"
              >
                <Trash2 aria-hidden="true" />
                Clear all
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Clear all favourites?</AlertDialogTitle>
                <AlertDialogDescription className="text-ink-soft">
                  This removes every saved name from this browser. It can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep them</AlertDialogCancel>
                <AlertDialogAction onClick={onClear}>Clear all</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {favourites.length === 0 ? (
        <p className="mt-3 text-ink-soft">
          Nothing saved yet. Press Favourite when a name deserves keeping.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-rule/70" aria-label="Saved names">
          {favourites.map((f) => (
            <li key={f.id} className="flex items-center gap-1 py-1.5">
              <span className="min-w-0 flex-1 font-display text-lg break-words text-ink">
                {f.display}
              </span>
              <CopyNameButton
                compact
                text={f.display}
                label={`Copy ${f.display}`}
                onResult={onCopyResult}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 text-ink-soft hover:text-ink"
                aria-label={`Remove ${f.display}`}
                onClick={() => onRemove(f.id)}
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
