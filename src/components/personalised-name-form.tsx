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
export function PersonalisedNameForm({ onReveal }: { onReveal: (name: GeneratedName) => void }) {
  const [value, setValue] = useState("");
  const [problem, setProblem] = useState<NameInputProblem | null>(null);
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = checkNameInput(value);
    setProblem(issue);
    if (issue) return;
    const name = personalisedName(value);
    if (name) onReveal(name);
  }

  return (
    <section
      aria-labelledby={`${inputId}-heading`}
      className="w-full rounded-md border border-rule bg-card/80 p-4 sm:p-5"
    >
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
          <Button type="submit" className="h-11 rounded-full px-6 font-semibold hover:bg-oxblood-hover">
            Reveal my Toast name
          </Button>
        </div>
        {problem && (
          <p id={errorId} className="mt-2 text-sm font-semibold text-destructive">
            {PROBLEMS[problem]}
          </p>
        )}
        <p id={hintId} className="mt-2 text-sm text-ink-soft">
          The same name always gets the same Toast name. Your name stays on this device. It
          isn&apos;t stored or sent anywhere.
        </p>
      </form>
    </section>
  );
}
