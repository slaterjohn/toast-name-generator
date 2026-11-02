import type { GeneratedName } from "@/lib/names";

/**
 * The generated name, set like a top-billed credit. The visible heading is
 * not a live region; announcements go through a separate polite region so a
 * screen reader hears just the new name, once.
 */
export function NameDisplay({
  name,
  label,
  sequence,
}: {
  name: GeneratedName | null;
  label: string;
  sequence: number | string;
}) {
  return (
    <div className="flex min-h-[9.5rem] flex-col items-center justify-center sm:min-h-[11rem]">
      <p className="mb-3 text-xs font-semibold tracking-[0.25em] text-ink-soft uppercase">{label}</p>
      {name ? (
        <h2
          key={sequence}
          className="name-enter max-w-full font-display text-[clamp(2.5rem,10vw,4.75rem)] leading-[1.08] font-bold text-balance break-words text-ink"
          data-testid="generated-name"
        >
          {name.display}
        </h2>
      ) : (
        <div
          aria-hidden="true"
          className="h-[1.1em] w-3/4 max-w-sm animate-pulse rounded bg-paper-deep font-display text-[clamp(2.5rem,10vw,4.75rem)] motion-reduce:animate-none"
        />
      )}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {name ? `${label}: ${name.display}` : ""}
      </p>
    </div>
  );
}
