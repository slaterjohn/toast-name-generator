import { describe, expect, it } from "vitest";
import { getDefaultCorpus, createEngine } from "@/lib/names";
import { countEligible } from "@/lib/names/count";
import { estimateSyllables } from "@/lib/names/corpus";
import {
  EXCLUDED_FULL_NAMES,
  EXCLUDED_GIVEN,
  EXCLUDED_SURNAME_TOKENS,
} from "@/lib/names/exclusions";
import { normaliseName, normaliseToken } from "@/lib/names/normalise";

const corpus = getDefaultCorpus();
const engine = createEngine(corpus);

describe("corpus", () => {
  it("is substantial", () => {
    expect(corpus.given.length).toBeGreaterThanOrEqual(300);
    expect(corpus.surnames.length).toBeGreaterThanOrEqual(700);
    expect(corpus.barrelLeft.length).toBeGreaterThanOrEqual(80);
    expect(corpus.barrelRight.length).toBeGreaterThanOrEqual(60);
  });

  it("has every category reasonably populated", () => {
    const counts = new Map<string, number>();
    for (const g of corpus.given) counts.set(`g:${g.category}`, (counts.get(`g:${g.category}`) ?? 0) + 1);
    for (const s of corpus.surnames) counts.set(`s:${s.category}`, (counts.get(`s:${s.category}`) ?? 0) + 1);
    for (const [, n] of counts) expect(n).toBeGreaterThanOrEqual(60);
  });

  it("has no duplicate given names or surnames (by normalised form)", () => {
    const dupes = (list: { norm: string }[]) => {
      const seen = new Set<string>();
      return list.filter((x) => (seen.has(x.norm) ? true : (seen.add(x.norm), false))).map((x) => x.norm);
    };
    expect(dupes(corpus.given)).toEqual([]);
    expect(dupes(corpus.surnames)).toEqual([]);
    expect(dupes(corpus.barrelLeft)).toEqual([]);
    expect(dupes(corpus.barrelRight)).toEqual([]);
  });

  it("uses single, capitalised words only", () => {
    const all = [...corpus.given, ...corpus.surnames, ...corpus.barrelLeft, ...corpus.barrelRight];
    for (const c of all) expect(c.text).toMatch(/^[A-Z][a-z]+$/);
  });

  it("contains no excluded components", () => {
    const given = new Set(EXCLUDED_GIVEN.map(normaliseToken));
    const tokens = new Set(EXCLUDED_SURNAME_TOKENS.map(normaliseToken));
    expect(corpus.given.filter((g) => given.has(g.norm))).toEqual([]);
    expect(corpus.surnames.filter((s) => tokens.has(s.norm))).toEqual([]);
    expect([...corpus.barrelLeft, ...corpus.barrelRight].filter((f) => tokens.has(f.norm))).toEqual([]);
  });

  it("never treats an excluded full name as eligible", () => {
    for (const full of EXCLUDED_FULL_NAMES) {
      const [first, ...rest] = full.split(" ");
      const g = corpus.given.find((x) => x.norm === normaliseToken(first));
      const sNorm = normaliseName(rest.join(" "));
      const s = corpus.surnames.find((x) => x.norm === sNorm) ?? engine.surnameById(
        sNorm.includes("-") ? `c:${sNorm.replace("-", "~")}` : "none",
      );
      if (g && s) expect(engine.isEligible(g, s), full).toBe(false);
    }
  });

  it("estimates syllables sensibly", () => {
    expect(estimateSyllables("Kettle")).toBe(2);
    expect(estimateSyllables("Gus")).toBe(1);
    expect(estimateSyllables("Pemberton")).toBe(3);
    expect(estimateSyllables("Ophelia")).toBe(4);
    expect(estimateSyllables("Clive")).toBe(1);
  });
});

describe("eligible name count", () => {
  const count = countEligible(engine, { checkDisplay: true });

  it("exceeds one million distinct full names after all restrictions", () => {
    expect(count.total).toBeGreaterThanOrEqual(1_000_000);
  });

  it("counts distinct display strings, not just distinct IDs", () => {
    expect(count.distinctDisplays).toBe(count.total);
  });

  it("has a large simple-surname space on its own", () => {
    expect(count.simpleNames).toBeGreaterThanOrEqual(200_000);
  });

  it("matches the documented figure (update docs/NAMING-ENGINE.md if this changes)", () => {
    expect({
      total: count.total,
      simpleNames: count.simpleNames,
      compoundNames: count.compoundNames,
      compoundSurnames: count.compoundSurnames,
    }).toMatchInlineSnapshot(`
      {
        "compoundNames": 3171453,
        "compoundSurnames": 9274,
        "simpleNames": 247200,
        "total": 3418653,
      }
    `);
  });
});
