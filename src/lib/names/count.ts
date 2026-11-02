import { isCompatibleCompound } from "./compatibility";
import { makeCompound } from "./corpus";
import type { NameEngine } from "./generator";
import { normaliseName } from "./normalise";
import type { Surname } from "./types";

export interface EligibleCount {
  givenNames: number;
  simpleSurnames: number;
  barrelLeft: number;
  barrelRight: number;
  /** Double-barrelled surnames that pass the compound rules. */
  compoundSurnames: number;
  /** Eligible full names with a simple surname. */
  simpleNames: number;
  /** Eligible full names with a double-barrelled surname. */
  compoundNames: number;
  total: number;
  /** Eligible full names per template (a name can satisfy several). */
  byTemplate: Record<string, number>;
  /** Distinct normalised display strings seen (only when `checkDisplay` is set). */
  distinctDisplays?: number;
}

/**
 * Exact count of distinct full names the engine can emit, after templates,
 * compatibility rules and exclusions. Iterates the whole product, so it is
 * meant for tests and the reporting script, not the browser.
 */
export function countEligible(engine: NameEngine, opts: { checkDisplay?: boolean } = {}): EligibleCount {
  const { corpus, templates } = engine;
  const compounds: Surname[] = [];
  for (const l of corpus.barrelLeft) {
    for (const r of corpus.barrelRight) {
      if (isCompatibleCompound(l, r)) compounds.push(makeCompound(l, r));
    }
  }

  const byTemplate: Record<string, number> = Object.fromEntries(templates.map((t) => [t.id, 0]));
  const displays = opts.checkDisplay ? new Set<string>() : null;
  let simpleNames = 0;
  let compoundNames = 0;

  for (const g of corpus.given) {
    for (const list of [corpus.surnames, compounds]) {
      for (const s of list) {
        const matching = engine.templatesFor(g, s);
        if (matching.length === 0) continue;
        if (s.category === "compound") compoundNames++;
        else simpleNames++;
        for (const t of matching) byTemplate[t.id]++;
        displays?.add(normaliseName(`${g.text} ${s.text}`));
      }
    }
  }

  return {
    givenNames: corpus.given.length,
    simpleSurnames: corpus.surnames.length,
    barrelLeft: corpus.barrelLeft.length,
    barrelRight: corpus.barrelRight.length,
    compoundSurnames: compounds.length,
    simpleNames,
    compoundNames,
    total: simpleNames + compoundNames,
    byTemplate,
    distinctDisplays: displays?.size,
  };
}
