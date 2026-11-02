import { isCompatibleCompound, isCompatiblePair } from "./compatibility";
import { makeCompound } from "./corpus";
import { normaliseName } from "./normalise";
import { randomInt, weightedIndex } from "./random";
import { TEMPLATES } from "./templates";
import type {
  Corpus,
  GeneratedName,
  GivenCategory,
  GivenName,
  NameTemplate,
  RandomSource,
  SurnameCategory,
  Surname,
} from "./types";

/** Random draws attempted before falling back to an exhaustive scan. */
export const SAMPLE_ATTEMPTS = 64;

/**
 * A pool of surnames addressable by index. Compound pools are virtual: the
 * left × right product is never materialised, and incompatible pairs return
 * null.
 */
interface SurnamePool {
  size: number;
  get(index: number): Surname | null;
}

/** What the current pick must avoid. Built by the session from its history. */
export interface Exclusions {
  givenIds: ReadonlySet<string>;
  givenNorms: ReadonlySet<string>;
  surnameIds: ReadonlySet<string>;
  /** Normalised surname tokens, including each half of recent compounds. */
  surnameTokens: ReadonlySet<string>;
  emittedIds: ReadonlySet<string>;
  emittedNorms: ReadonlySet<string>;
}

export interface NameEngine {
  corpus: Corpus;
  templates: readonly NameTemplate[];
  /** Pick one valid candidate, or null if none exists under these exclusions. */
  pick(rng: RandomSource, exclusions: Exclusions): GeneratedName | null;
  givenById(id: string): GivenName | undefined;
  surnameById(id: string): Surname | undefined;
  /** Template membership + compatibility, ignoring session history. */
  isEligible(given: GivenName, surname: Surname): boolean;
  /** Every template whose rules this pair satisfies. */
  templatesFor(given: GivenName, surname: Surname): NameTemplate[];
}

function arrayPool(list: Surname[]): SurnamePool {
  return { size: list.length, get: (i) => list[i] ?? null };
}

export function createEngine(
  corpus: Corpus,
  templates: readonly NameTemplate[] = TEMPLATES,
): NameEngine {
  const givenByCategory = new Map<GivenCategory, GivenName[]>();
  for (const g of corpus.given) {
    const list = givenByCategory.get(g.category) ?? [];
    list.push(g);
    givenByCategory.set(g.category, list);
  }

  const simpleByCategory = new Map<SurnameCategory, Surname[]>();
  for (const s of corpus.surnames) {
    const list = simpleByCategory.get(s.category) ?? [];
    list.push(s);
    simpleByCategory.set(s.category, list);
  }

  const L = corpus.barrelLeft.length;
  const R = corpus.barrelRight.length;
  const compoundPool: SurnamePool = {
    size: L * R,
    get(index) {
      const left = corpus.barrelLeft[Math.floor(index / R)];
      const right = corpus.barrelRight[index % R];
      if (!left || !right || !isCompatibleCompound(left, right)) return null;
      return makeCompound(left, right);
    },
  };

  const poolCache = new Map<SurnameCategory, SurnamePool>();
  function poolFor(category: SurnameCategory): SurnamePool {
    if (category === "compound") return compoundPool;
    let pool = poolCache.get(category);
    if (!pool) {
      pool = arrayPool(simpleByCategory.get(category) ?? []);
      poolCache.set(category, pool);
    }
    return pool;
  }

  // Alliterative template: simple surnames indexed by template + initial.
  const alliterationIndex = new Map<string, SurnamePool>();
  function alliterativePool(template: NameTemplate, initial: string): SurnamePool {
    const key = `${template.id}:${initial}`;
    let pool = alliterationIndex.get(key);
    if (!pool) {
      const list = template.surname
        .filter((c) => c !== "compound")
        .flatMap((c) => simpleByCategory.get(c) ?? [])
        .filter((s) => s.initial === initial);
      pool = arrayPool(list);
      alliterationIndex.set(key, pool);
    }
    return pool;
  }

  const givenMap = new Map(corpus.given.map((g) => [g.id, g]));
  const simpleMap = new Map(corpus.surnames.map((s) => [s.id, s]));
  const leftMap = new Map(corpus.barrelLeft.map((f) => [f.norm, f]));
  const rightMap = new Map(corpus.barrelRight.map((f) => [f.norm, f]));

  function surnameById(id: string): Surname | undefined {
    if (id.startsWith("c:")) {
      const [l, r] = id.slice(2).split("~");
      const left = leftMap.get(l);
      const right = rightMap.get(r);
      if (!left || !right || !isCompatibleCompound(left, right)) return undefined;
      return makeCompound(left, right);
    }
    return simpleMap.get(id);
  }

  // Only templates that can actually produce something with this corpus.
  const usableTemplates = templates.filter(
    (t) =>
      t.given.some((c) => (givenByCategory.get(c)?.length ?? 0) > 0) &&
      t.surname.some((c) => poolFor(c).size > 0),
  );
  const templateWeights = usableTemplates.map((t) => t.weight);

  function templateAccepts(t: NameTemplate, g: GivenName, s: Surname): boolean {
    if (!t.given.includes(g.category)) return false;
    if (!t.surname.includes(s.category)) return false;
    if (t.alliterative && g.initial !== s.initial) return false;
    return true;
  }

  function templatesFor(g: GivenName, s: Surname): NameTemplate[] {
    if (!isCompatiblePair(g, s)) return [];
    return templates.filter((t) => templateAccepts(t, g, s));
  }

  function isEligible(g: GivenName, s: Surname): boolean {
    return templatesFor(g, s).length > 0;
  }

  function givenExcluded(g: GivenName, ex: Exclusions): boolean {
    return ex.givenIds.has(g.id) || ex.givenNorms.has(g.norm);
  }

  function surnameExcluded(s: Surname, ex: Exclusions): boolean {
    if (ex.surnameIds.has(s.id)) return true;
    for (const token of s.tokens) if (ex.surnameTokens.has(token)) return true;
    return false;
  }

  function finish(t: NameTemplate, g: GivenName, s: Surname, ex: Exclusions): GeneratedName | null {
    if (surnameExcluded(s, ex)) return null;
    if (!isCompatiblePair(g, s)) return null;
    const id = `${g.id}|${s.id}`;
    const display = `${g.text} ${s.text}`;
    const norm = normaliseName(display);
    if (ex.emittedIds.has(id) || ex.emittedNorms.has(norm)) return null;
    return { given: g, surname: s, id, display, norm, templateId: t.id };
  }

  function sampleOnce(rng: RandomSource, ex: Exclusions): GeneratedName | null {
    const t = usableTemplates[weightedIndex(rng, templateWeights)];
    const givenCats = t.given.filter((c) => (givenByCategory.get(c)?.length ?? 0) > 0);
    const gList = givenByCategory.get(givenCats[randomInt(rng, givenCats.length)])!;
    const g = gList[randomInt(rng, gList.length)];
    if (givenExcluded(g, ex)) return null;

    let pool: SurnamePool;
    if (t.alliterative) {
      pool = alliterativePool(t, g.initial);
    } else {
      const cats = t.surname.filter((c) => poolFor(c).size > 0);
      pool = poolFor(cats[randomInt(rng, cats.length)]);
    }
    if (pool.size === 0) return null;
    const s = pool.get(randomInt(rng, pool.size));
    if (!s) return null;
    return finish(t, g, s, ex);
  }

  /**
   * Exhaustive, bounded scan used only when random sampling keeps failing.
   * Visits every template, given name and surname once, starting at random
   * offsets so the fallback is not biased towards the start of each list.
   */
  function scan(rng: RandomSource, ex: Exclusions): GeneratedName | null {
    if (usableTemplates.length === 0) return null;
    const tStart = weightedIndex(rng, templateWeights);
    for (let ti = 0; ti < usableTemplates.length; ti++) {
      const t = usableTemplates[(tStart + ti) % usableTemplates.length];
      const givens = t.given.flatMap((c) => givenByCategory.get(c) ?? []);
      if (givens.length === 0) continue;
      const gStart = randomInt(rng, givens.length);
      for (let gi = 0; gi < givens.length; gi++) {
        const g = givens[(gStart + gi) % givens.length];
        if (givenExcluded(g, ex)) continue;
        const pools = t.alliterative
          ? [alliterativePool(t, g.initial)]
          : t.surname.map(poolFor).filter((p) => p.size > 0);
        for (const pool of pools) {
          const sStart = randomInt(rng, pool.size);
          for (let si = 0; si < pool.size; si++) {
            const s = pool.get((sStart + si) % pool.size);
            if (!s) continue;
            const result = finish(t, g, s, ex);
            if (result) return result;
          }
        }
      }
    }
    return null;
  }

  return {
    corpus,
    templates,
    pick(rng, ex) {
      if (usableTemplates.length === 0) return null;
      for (let attempt = 0; attempt < SAMPLE_ATTEMPTS; attempt++) {
        const result = sampleOnce(rng, ex);
        if (result) return result;
      }
      return scan(rng, ex);
    },
    givenById: (id) => givenMap.get(id),
    surnameById,
    isEligible,
    templatesFor,
  };
}

/**
 * Rebuild a GeneratedName from its canonical `${givenId}|${surnameId}` ID.
 * Returns null for unknown IDs or pairs the engine would never emit.
 */
export function resolveName(engine: NameEngine, fullId: string): GeneratedName | null {
  const [givenId, surnameId] = fullId.split("|");
  const given = givenId ? engine.givenById(givenId) : undefined;
  const surname = surnameId ? engine.surnameById(surnameId) : undefined;
  if (!given || !surname) return null;
  const templates = engine.templatesFor(given, surname);
  if (templates.length === 0) return null;
  const display = `${given.text} ${surname.text}`;
  return {
    given,
    surname,
    id: `${given.id}|${surname.id}`,
    display,
    norm: normaliseName(display),
    templateId: templates[0].id,
  };
}
