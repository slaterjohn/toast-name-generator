"use client";

import { ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFavourites } from "@/hooks/use-favourites";
import { useNameSession } from "@/hooks/use-name-session";
import { cn } from "@/lib/utils";
import { CopyNameButton, type CopyOutcome } from "./copy-name-button";
import { FavouriteToggle } from "./favourite-toggle";
import { NameDisplay } from "./name-display";
import { RegenerateButton } from "./regenerate-button";

// The favourites list is optional, so its code (and the dialog primitive it
// uses) loads only when someone opens it.
const FavouritesPanel = dynamic(() => import("./favourites-panel"), {
  ssr: false,
  loading: () => <p className="py-4 text-center text-ink-soft">Fetching the ledger…</p>,
});

const FEEDBACK_MS = 4000;

export function NameGenerator() {
  const { state, regenerate, reset } = useNameSession();
  const { favourites, toggle, remove, clear, isFavourite } = useFavourites();
  const [feedback, setFeedback] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const feedbackTimer = useRef<number | undefined>(undefined);

  const say = useCallback((message: string) => {
    window.clearTimeout(feedbackTimer.current);
    setFeedback(message);
    feedbackTimer.current = window.setTimeout(() => setFeedback(""), FEEDBACK_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(feedbackTimer.current), []);

  const onCopyResult = useCallback(
    (outcome: CopyOutcome, text: string) =>
      say(
        outcome === "copied"
          ? `Copied ${text} to the clipboard.`
          : "Couldn't copy automatically. Select the name and copy it by hand.",
      ),
    [say],
  );

  const name = state.status === "ready" ? state.name : null;
  const saved = name ? isFavourite(name.id) : false;

  function onToggleFavourite() {
    if (!name) return;
    toggle({ id: name.id, display: name.display });
    say(saved ? "Removed from favourites." : "Saved to favourites.");
  }

  function onRegenerate() {
    setFeedback("");
    regenerate();
  }

  function onRemove(id: string) {
    remove(id);
    say("Removed from favourites.");
    document.getElementById("favourites-toggle")?.focus({ preventScroll: true });
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center">
      <section
        aria-label="Generated name"
        className="relative w-full rounded-md border border-rule bg-card px-5 py-10 text-center shadow-[0_1px_0_rgb(0_0_0/0.04),0_12px_32px_-20px_rgb(60_20_20/0.35)] sm:px-10 sm:py-14"
      >
        {/* Inner rule, like a printed programme border. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-2 rounded-sm border border-rule/60"
        />

        {state.status === "exhausted" ? (
          <div className="relative flex min-h-[9.5rem] flex-col items-center justify-center gap-3">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              That&apos;s every name available in this session.
            </h2>
            <p className="max-w-md text-ink-soft">
              Starting afresh forgets this tab&apos;s history, so earlier names may come round
              again.
            </p>
            <Button type="button" onClick={reset} className="mt-2 h-11 rounded-full px-6">
              Start afresh
            </Button>
          </div>
        ) : (
          <div className="relative">
            <NameDisplay state={state} />
            <div className="mt-8 flex flex-col items-center gap-3">
              <RegenerateButton onClick={onRegenerate} disabled={state.status === "loading"} />
              <div className="flex flex-wrap justify-center gap-3">
                <CopyNameButton text={name?.display ?? null} onResult={onCopyResult} />
                <FavouriteToggle pressed={saved} onToggle={onToggleFavourite} disabled={!name} />
              </div>
            </div>
            {state.status === "ready" && state.runningLow && (
              <p className="mt-5 text-sm text-ink-soft">
                Fresh names are running short, so some first names or surnames may come back
                sooner than usual.
              </p>
            )}
          </div>
        )}
      </section>

      <p role="status" className="mt-4 min-h-6 text-center text-sm text-ink-soft">
        {feedback}
      </p>

      <div className="mt-2 flex w-full flex-col items-center gap-3">
        <Button
          id="favourites-toggle"
          type="button"
          variant="ghost"
          aria-expanded={panelOpen}
          aria-controls="favourites-region"
          onClick={() => setPanelOpen((o) => !o)}
          className="h-11 rounded-full px-4 text-ink-soft hover:text-ink"
        >
          Favourites{favourites.length > 0 ? ` (${favourites.length})` : ""}
          <ChevronDown
            aria-hidden="true"
            className={cn("transition-transform", panelOpen && "rotate-180")}
          />
        </Button>
        <div id="favourites-region" className="w-full" hidden={!panelOpen}>
          {panelOpen && (
            <FavouritesPanel
              favourites={favourites}
              onRemove={onRemove}
              onClear={() => {
                clear();
                say("All favourites cleared.");
              }}
              onCopyResult={onCopyResult}
            />
          )}
        </div>
      </div>
    </div>
  );
}
