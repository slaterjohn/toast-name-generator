"use client";

import { ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFavourites } from "@/hooks/use-favourites";
import { useNameSession } from "@/hooks/use-name-session";
import { createEngine, getDefaultCorpus, type GeneratedName } from "@/lib/names";
import { decodeShareCode, SHARE_PARAM } from "@/lib/names/share";
import { cn } from "@/lib/utils";
import { CopyNameButton, type CopyOutcome } from "./copy-name-button";
import { FavouriteToggle } from "./favourite-toggle";
import { NameDisplay } from "./name-display";
import { PersonalisedNameForm } from "./personalised-name-form";
import { RegenerateButton } from "./regenerate-button";
import { ShareControls } from "./share-controls";

// The favourites list is optional, so its code (and the dialog primitive it
// uses) loads only when someone opens it.
const FavouritesPanel = dynamic(() => import("./favourites-panel"), {
  ssr: false,
  loading: () => <p className="py-4 text-center text-ink-soft">Fetching the ledger…</p>,
});

const FEEDBACK_MS = 4000;

type Override = { kind: "personal" | "shared"; name: GeneratedName };

const LABELS = {
  random: "May we present",
  personal: "Your Toast name",
  shared: "A name shared with you",
} as const;

/** Remove the share parameter from the address bar without reloading or scrolling. */
function clearShareParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(SHARE_PARAM)) return;
  url.searchParams.delete(SHARE_PARAM);
  window.history.replaceState(window.history.state, "", url.toString());
}

export function NameGenerator() {
  const { state, regenerate, reset } = useNameSession();
  const { favourites, toggle, remove, clear, isFavourite } = useFavourites();
  const [feedback, setFeedback] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [override, setOverride] = useState<Override | null>(null);
  const feedbackTimer = useRef<number | undefined>(undefined);
  const cardRef = useRef<HTMLElement>(null);

  const say = useCallback((message: string) => {
    window.clearTimeout(feedbackTimer.current);
    setFeedback(message);
    feedbackTimer.current = window.setTimeout(() => setFeedback(""), FEEDBACK_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(feedbackTimer.current), []);

  // A share link (?n=cyril.kettle) shows that name instead of a random one.
  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get(SHARE_PARAM);
    if (code === null) return;
    const shared = decodeShareCode(createEngine(getDefaultCorpus()), code);
    if (shared) {
      setOverride({ kind: "shared", name: shared });
    } else {
      clearShareParam();
      say("That shared name isn't one we recognise, so here's a fresh one.");
    }
  }, [say]);

  const onCopyResult = useCallback(
    (outcome: CopyOutcome, text: string) =>
      say(
        outcome === "copied"
          ? `Copied ${text} to the clipboard.`
          : "Couldn't copy automatically. Select the name and copy it by hand.",
      ),
    [say],
  );

  const name = override?.name ?? (state.status === "ready" ? state.name : null);
  const mode = override?.kind ?? "random";
  const label = LABELS[mode];
  const displayKey = name ? `${mode}:${name.id}:${state.status === "ready" ? state.sequence : 0}` : "none";
  const saved = name ? isFavourite(name.id) : false;

  function onToggleFavourite() {
    if (!name) return;
    toggle({ id: name.id, display: name.display });
    say(saved ? "Removed from favourites." : "Saved to favourites.");
  }

  function onRegenerate() {
    setFeedback("");
    if (override) {
      setOverride(null);
      clearShareParam();
    }
    regenerate();
  }

  function onReveal(personal: GeneratedName) {
    setFeedback("");
    clearShareParam();
    setOverride({ kind: "personal", name: personal });
    const card = cardRef.current;
    if (card && card.getBoundingClientRect().top < 0) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      card.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    }
  }

  function onRemove(id: string) {
    remove(id);
    say("Removed from favourites.");
    document.getElementById("favourites-toggle")?.focus({ preventScroll: true });
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center">
      <section
        ref={cardRef}
        aria-label="Generated name"
        className="relative w-full rounded-md border border-rule bg-card px-5 py-10 text-center shadow-[0_1px_0_rgb(0_0_0/0.04),0_12px_32px_-20px_rgb(60_20_20/0.35)] sm:px-10 sm:py-14"
      >
        {/* Inner rule, like a printed programme border. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-2 rounded-sm border border-rule/60"
        />

        {state.status === "exhausted" && !override ? (
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
            <NameDisplay name={name} label={label} sequence={displayKey} />
            <div className="mt-8 flex flex-col items-center gap-3">
              <RegenerateButton
                onClick={onRegenerate}
                disabled={state.status === "loading" && !override}
              />
              <div className="flex flex-wrap justify-center gap-3">
                <CopyNameButton text={name?.display ?? null} onResult={onCopyResult} />
                <FavouriteToggle pressed={saved} onToggle={onToggleFavourite} disabled={!name} />
              </div>
            </div>
            <div className="mt-4">
              <ShareControls name={name} label={label} onFeedback={say} />
            </div>
            {mode === "random" && state.status === "ready" && state.runningLow && (
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

      <div className="mt-2 w-full">
        <PersonalisedNameForm onReveal={onReveal} />
      </div>

      <div className="mt-6 flex w-full flex-col items-center gap-3">
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
