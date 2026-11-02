import { BARREL_LEFT_DATA, BARREL_RIGHT_DATA, GIVEN_DATA, SURNAME_DATA } from "./corpus-data";
import { isExcludedGiven, isExcludedSurnameToken } from "./exclusions";
import { normaliseToken } from "./normalise";
import type {
  Corpus,
  Fragment,
  FragmentCategory,
  GivenCategory,
  GivenName,
  PhoneticTag,
  SimpleSurnameCategory,
  Surname,
} from "./types";

/**
 * Bump when any bank changes in a way that alters output. Phase 2's
 * deterministic mapping will key off this, so released versions must stay
 * frozen once personalised names exist.
 */
export const CORPUS_VERSION = 1;

/** Rough English syllable count from spelling. Good enough for rhythm rules. */
export function estimateSyllables(word: string): number {
  const w = normaliseToken(word);
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  let count = groups ? groups.length : 1;
  // "-ia", "-io" and "-eo" usually split into two syllables (Ophelia, Leopold).
  const hiatus = trimmed.match(/(?:ia|io|eo)/g);
  if (hiatus) count += hiatus.length;
  return Math.max(1, count);
}

const PLOSIVES = new Set(["b", "d", "g", "k", "p", "t", "c", "q"]);
const VOWELS = new Set(["a", "e", "i", "o", "u"]);

export function phoneticTags(norm: string, syllables: number): PhoneticTag[] {
  const tags: PhoneticTag[] = [];
  tags.push(syllables === 1 ? "monosyllable" : "polysyllable");
  const first = norm[0];
  if (PLOSIVES.has(first)) tags.push("plosive-onset");
  if (first === "s" || first === "z") tags.push("sibilant-onset");
  if (VOWELS.has(first)) tags.push("vowel-onset");
  const last = norm[norm.length - 1];
  if (VOWELS.has(last) || last === "y") tags.push("vowel-ending");
  if (last === "s" || last === "z" || norm.endsWith("sh") || norm.endsWith("ch")) {
    tags.push("sibilant-ending");
  }
  return tags;
}

function words(block: string): string[] {
  return block.split(/\s+/).filter(Boolean);
}

function baseFields(text: string) {
  const norm = normaliseToken(text);
  const syllables = estimateSyllables(text);
  return { text, norm, syllables, initial: norm[0], tags: phoneticTags(norm, syllables) };
}

export function makeGiven(text: string, category: GivenCategory): GivenName {
  const base = baseFields(text);
  return { kind: "given", id: `g:${base.norm}`, category, ...base };
}

export function makeSurname(text: string, category: SimpleSurnameCategory): Surname {
  const base = baseFields(text);
  return { kind: "surname", id: `s:${base.norm}`, category, tokens: [base.norm], ...base };
}

export function makeFragment(text: string, category: FragmentCategory): Fragment {
  const base = baseFields(text);
  const prefix = category === "barrelLeft" ? "l" : "r";
  return { kind: "fragment", id: `${prefix}:${base.norm}`, category, ...base };
}

/** Assemble a double-barrelled surname. Compatibility is checked elsewhere. */
export function makeCompound(left: Fragment, right: Fragment): Surname {
  const text = `${left.text}-${right.text}`;
  const norm = `${left.norm}-${right.norm}`;
  const syllables = left.syllables + right.syllables;
  return {
    kind: "surname",
    id: `c:${left.norm}~${right.norm}`,
    category: "compound",
    text,
    norm,
    syllables,
    initial: left.initial,
    tags: phoneticTags(norm, syllables),
    tokens: [left.norm, right.norm],
  };
}

export interface CorpusInput {
  given: Partial<Record<GivenCategory, string[]>>;
  surnames: Partial<Record<SimpleSurnameCategory, string[]>>;
  barrelLeft: string[];
  barrelRight: string[];
}

/**
 * Build a corpus from raw word lists, dropping any component on the
 * exclusion lists. Exposed so tests can build deliberately tiny corpora.
 */
export function buildCorpus(input: CorpusInput, version = CORPUS_VERSION): Corpus {
  const given: GivenName[] = [];
  for (const [category, list] of Object.entries(input.given) as [GivenCategory, string[]][]) {
    for (const text of list) {
      const entry = makeGiven(text, category);
      if (!isExcludedGiven(entry.norm)) given.push(entry);
    }
  }
  const surnames: Surname[] = [];
  for (const [category, list] of Object.entries(input.surnames) as [
    SimpleSurnameCategory,
    string[],
  ][]) {
    for (const text of list) {
      const entry = makeSurname(text, category);
      if (!isExcludedSurnameToken(entry.norm)) surnames.push(entry);
    }
  }
  const barrelLeft = input.barrelLeft
    .map((t) => makeFragment(t, "barrelLeft"))
    .filter((f) => !isExcludedSurnameToken(f.norm));
  const barrelRight = input.barrelRight
    .map((t) => makeFragment(t, "barrelRight"))
    .filter((f) => !isExcludedSurnameToken(f.norm));
  return { version, given, surnames, barrelLeft, barrelRight };
}

function mapValues<K extends string>(obj: Record<K, string>): Record<K, string[]> {
  const out = {} as Record<K, string[]>;
  for (const key of Object.keys(obj) as K[]) out[key] = words(obj[key]);
  return out;
}

let defaultCorpus: Corpus | null = null;

/** The curated production corpus (built once, lazily). */
export function getDefaultCorpus(): Corpus {
  if (!defaultCorpus) {
    defaultCorpus = buildCorpus({
      given: mapValues(GIVEN_DATA),
      surnames: mapValues(SURNAME_DATA),
      barrelLeft: words(BARREL_LEFT_DATA),
      barrelRight: words(BARREL_RIGHT_DATA),
    });
  }
  return defaultCorpus;
}
