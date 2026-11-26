"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import type { GeneratedName } from "@/lib/names";
import { checkNameInput, MAX_NAME_LENGTH, type NameInputProblem } from "@/lib/names/canonicalise";
import { personalisedName } from "@/lib/names/deterministic";

const PROBLEMS: Record<NameInputProblem, string> = {
  empty: "Enter a name first.",
  "no-letters": "Enter a name with at least one letter or number.",
  "too-long": `That's a lot of name. Keep it under ${MAX_NAME_LENGTH} characters.`,
};

/**
 * One free-text field. The value lives only in this component's state: the
 * input has no `name` attribute (so a no-JS form submission sends nothing),
 * autocomplete is off, and the value is never written to storage, the URL
 * or any request.
 */
export function PersonalisedNameForm({
  onReveal,
  onRepeat,
  shownId,
}: {
  onReveal: (name: GeneratedName) => void;
  /** Called when Reveal is pressed again for the Toast name already on show. */
  onRepeat?: () => void;
  /** The id of the personal Toast name currently on show, if any. */
  shownId: string | null;
}) {
  const [value, setValue] = useState("");
  const [problem, setProblem] = useState<NameInputProblem | null>(null);
  const [repeat, setRepeat] = useState(false);
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = checkNameInput(value);
    setProblem(issue);
    if (issue) {
      setRepeat(false);
      return;
    }
    const name = personalisedName(value);
    if (!name) return;
    // The same name always maps to the same Toast name, so a second press
    // would change nothing. Say so instead of re-running the reveal.
    if (name.id === shownId) {
      setRepeat(true);
      onRepeat?.();
      return;
    }
    setRepeat(false);
    onReveal(name);
  }

  return (
    <section
      aria-labelledby={`${inputId}-heading`}
      className="relative w-full rounded-md border border-rule bg-card p-6 shadow-[0_1px_0_rgb(0_0_0/0.04),0_12px_32px_-20px_rgb(60_20_20/0.35)] sm:p-10"
    >
      {/* Inner rule, matching the main name card. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-2 rounded-sm border border-rule/60"
      />
      <div className="relative">
        <h2 id={`${inputId}-heading`} className="font-display text-xl font-bold text-ink">
          Find your own Toast name
        </h2>
        <form onSubmit={handleSubmit} noValidate className="mt-3" autoComplete="off">
          <label htmlFor={inputId} className="block font-semibold text-ink">
            Your name
          </label>
          <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
            <input
              id={inputId}
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (problem) setProblem(null);
                if (repeat) setRepeat(false);
              }}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              maxLength={MAX_NAME_LENGTH * 2}
              aria-invalid={problem ? true : undefined}
              aria-describedby={problem ? `${errorId} ${hintId}` : hintId}
              className="h-11 w-full min-w-0 rounded-md border border-control sm:flex-1 bg-paper px-3 text-base text-ink placeholder:text-ink-soft/80 aria-invalid:border-destructive"
            />
            <Button
              type="submit"
              className="h-11 rounded-full px-6 font-semibold hover:bg-oxblood-hover"
            >
              Reveal my Toast name
            </Button>
          </div>
          {problem && (
            <p id={errorId} className="mt-2 text-sm font-semibold text-destructive">
              {PROBLEMS[problem]}
            </p>
          )}
          <p
            aria-live="polite"
            data-testid="repeat-note"
            className="text-sm text-ink empty:hidden [&:not(:empty)]:mt-2"
          >
            {repeat && (
              <>
                <strong className="font-semibold text-oxblood">
                  Woah! Hold your horses, sunshine.
                </strong>{" "}
                The same name always gets the same Toast name, so pressing again won&apos;t change
                it.
              </>
            )}
          </p>
          <p id={hintId} className="mt-2 text-sm text-ink-soft">
            Your name stays on this device. It isn&apos;t stored or sent anywhere.
          </p>
        </form>
      </div>
    </section>
  );
}
