import { resolveName, type Exclusions, type NameEngine } from "./generator";
import type { GeneratedName, RandomSource } from "./types";

/** Given names and surnames from this many previous generations are avoided. */
export const HISTORY_WINDOW = 20;

/** Most emitted IDs kept in a persisted snapshot (sessionStorage budget). */
export const MAX_PERSISTED_EMITTED = 10_000;

interface HistoryEntry {
  givenId: string;
  givenNorm: string;
  surnameId: string;
  surnameTokens: string[];
}

export type GenerateResult =
  | {
      status: "ok";
      name: GeneratedName;
      /**
       * How many previous generations were excluded when this name was
       * picked. Equals HISTORY_WINDOW normally; lower means the oldest
       * exclusions had to be relaxed.
       */
      windowUsed: number;
    }
  | { status: "exhausted" };

/** Compact, JSON-safe form for sessionStorage. */
export interface SessionSnapshot {
  v: 1;
  corpusVersion: number;
  /** Emitted full-name IDs, oldest first. */
  emitted: string[];
  /** Recent [givenId, surnameId] pairs, oldest first (max HISTORY_WINDOW). */
  recent: [string, string][];
}

/**
 * Session-level generation state. All mutation happens inside `generate()`
 * in a single synchronous step, so the history structures can never disagree
 * with each other.
 */
export class NameSession {
  private readonly emittedIds = new Set<string>();
  private readonly emittedNorms = new Set<string>();
  private readonly emittedOrder: string[] = [];
  private recent: HistoryEntry[] = [];
  private currentName: GeneratedName | null = null;

  constructor(
    private readonly engine: NameEngine,
    private readonly rng: RandomSource,
    private readonly window: number = HISTORY_WINDOW,
  ) {}

  get current(): GeneratedName | null {
    return this.currentName;
  }

  get emittedCount(): number {
    return this.emittedOrder.length;
  }

  /** Given-name IDs, oldest first. */
  get givenHistory(): string[] {
    return this.recent.map((e) => e.givenId);
  }

  /** Surname IDs, oldest first. */
  get surnameHistory(): string[] {
    return this.recent.map((e) => e.surnameId);
  }

  private exclusionsFor(windowSize: number): Exclusions {
    const slice = windowSize > 0 ? this.recent.slice(-windowSize) : [];
    const surnameTokens = new Set<string>();
    for (const e of slice) for (const t of e.surnameTokens) surnameTokens.add(t);
    return {
      givenIds: new Set(slice.map((e) => e.givenId)),
      givenNorms: new Set(slice.map((e) => e.givenNorm)),
      surnameIds: new Set(slice.map((e) => e.surnameId)),
      surnameTokens,
      emittedIds: this.emittedIds,
      emittedNorms: this.emittedNorms,
    };
  }

  generate(): GenerateResult {
    // Full window first; then drop the oldest generation from the exclusions
    // one at a time. The immediately previous generation (window 1) is never
    // relaxed, and the full-name rule is never relaxed at all.
    const minimum = this.recent.length > 0 ? 1 : 0;
    const start = Math.min(this.window, this.recent.length);
    for (let w = start; w >= minimum; w--) {
      const name = this.engine.pick(this.rng, this.exclusionsFor(w));
      if (name) {
        this.commit(name);
        return { status: "ok", name, windowUsed: w };
      }
    }
    return { status: "exhausted" };
  }

  private commit(name: GeneratedName): void {
    this.emittedIds.add(name.id);
    this.emittedNorms.add(name.norm);
    this.emittedOrder.push(name.id);
    this.recent.push({
      givenId: name.given.id,
      givenNorm: name.given.norm,
      surnameId: name.surname.id,
      surnameTokens: name.surname.tokens,
    });
    if (this.recent.length > this.window) this.recent = this.recent.slice(-this.window);
    this.currentName = name;
  }

  snapshot(): SessionSnapshot {
    return {
      v: 1,
      corpusVersion: this.engine.corpus.version,
      emitted: this.emittedOrder.slice(-MAX_PERSISTED_EMITTED),
      recent: this.recent.map((e) => [e.givenId, e.surnameId]),
    };
  }

  /**
   * Rebuild a session from a snapshot. Unknown IDs (from an older corpus) are
   * skipped. Returns a fresh session if the snapshot is unusable.
   */
  static restore(
    engine: NameEngine,
    rng: RandomSource,
    snapshot: unknown,
    window: number = HISTORY_WINDOW,
  ): NameSession {
    const session = new NameSession(engine, rng, window);
    if (!isSnapshot(snapshot) || snapshot.corpusVersion !== engine.corpus.version) return session;

    for (const id of snapshot.emitted.slice(-MAX_PERSISTED_EMITTED)) {
      const name = resolveName(engine, id);
      if (!name || session.emittedIds.has(name.id)) continue;
      session.emittedIds.add(name.id);
      session.emittedNorms.add(name.norm);
      session.emittedOrder.push(name.id);
    }
    for (const [givenId, surnameId] of snapshot.recent.slice(-window)) {
      const name = resolveName(engine, `${givenId}|${surnameId}`);
      if (!name) continue;
      session.recent.push({
        givenId,
        givenNorm: name.given.norm,
        surnameId,
        surnameTokens: name.surname.tokens,
      });
      session.currentName = name;
    }
    return session;
  }
}

function isSnapshot(value: unknown): value is SessionSnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<SessionSnapshot>;
  return (
    v.v === 1 &&
    typeof v.corpusVersion === "number" &&
    Array.isArray(v.emitted) &&
    v.emitted.every((x) => typeof x === "string") &&
    Array.isArray(v.recent) &&
    v.recent.every(
      (x) => Array.isArray(x) && x.length === 2 && x.every((y) => typeof y === "string"),
    )
  );
}
