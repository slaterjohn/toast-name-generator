import { describe, expect, it } from "vitest";
import {
  buildCorpus,
  createEngine,
  createSeededRandom,
  getDefaultCorpus,
  HISTORY_WINDOW,
  NameSession,
  type GeneratedName,
  type NameTemplate,
} from "@/lib/names";
import { isCompatiblePair } from "@/lib/names/compatibility";
import { isExcludedFullName } from "@/lib/names/exclusions";

const engine = createEngine(getDefaultCorpus());

function run(session: NameSession, n: number): GeneratedName[] {
  const out: GeneratedName[] = [];
  for (let i = 0; i < n; i++) {
    const r = session.generate();
    if (r.status !== "ok") throw new Error(`exhausted after ${i}`);
    out.push(r.name);
  }
  return out;
}

describe("generation with the production corpus", () => {
  const SEEDS = [1, 2, 3, 99, 2026];
  const N = 5_000;

  for (const seed of SEEDS) {
    describe(`seed ${seed}`, () => {
      const session = new NameSession(engine, createSeededRandom(seed));
      const names = run(session, N);

      it("emits valid, eligible, non-excluded names", () => {
        for (const n of names) {
          expect(n.display).toBe(`${n.given.text} ${n.surname.text}`);
          expect(engine.isEligible(n.given, n.surname)).toBe(true);
          expect(isCompatiblePair(n.given, n.surname)).toBe(true);
          expect(isExcludedFullName(n.norm)).toBe(false);
        }
      });

      it("never repeats a full name", () => {
        expect(new Set(names.map((n) => n.id)).size).toBe(N);
        expect(new Set(names.map((n) => n.norm)).size).toBe(N);
      });

      it(`never reuses a given name or surname within ${HISTORY_WINDOW} generations`, () => {
        for (let i = 0; i < names.length; i++) {
          const window = names.slice(Math.max(0, i - HISTORY_WINDOW), i);
          const tokens = new Set(window.flatMap((w) => w.surname.tokens));
          expect(window.map((w) => w.given.id)).not.toContain(names[i].given.id);
          expect(window.map((w) => w.surname.id)).not.toContain(names[i].surname.id);
          // Fragment reuse: no half of a double-barrel recurs either.
          for (const t of names[i].surname.tokens) expect(tokens.has(t)).toBe(false);
        }
      });
    });
  }

  it("uses every template and keeps them near their weights", () => {
    const names = run(new NameSession(engine, createSeededRandom(11)), 20_000);
    const totalWeight = engine.templates.reduce((a, t) => a + t.weight, 0);
    const counts = new Map<string, number>();
    for (const n of names) counts.set(n.templateId, (counts.get(n.templateId) ?? 0) + 1);
    for (const t of engine.templates) {
      const share = (counts.get(t.id) ?? 0) / names.length;
      const expected = t.weight / totalWeight;
      expect(share, t.id).toBeGreaterThan(expected * 0.6);
      expect(share, t.id).toBeLessThan(expected * 1.4);
    }
  });

  it("spreads output across components rather than a few favourites", () => {
    const names = run(new NameSession(engine, createSeededRandom(12)), 20_000);
    const given = new Map<string, number>();
    const endings = new Map<string, number>();
    for (const n of names) {
      given.set(n.given.id, (given.get(n.given.id) ?? 0) + 1);
      const last = n.surname.tokens[n.surname.tokens.length - 1];
      endings.set(last.slice(-3), (endings.get(last.slice(-3)) ?? 0) + 1);
    }
    // Most of the given-name bank appears, none dominates.
    expect(given.size).toBeGreaterThan(engine.corpus.given.length * 0.9);
    expect(Math.max(...given.values()) / names.length).toBeLessThan(0.01);
    // No surname ending accounts for more than 4% of output.
    expect(Math.max(...endings.values()) / names.length).toBeLessThan(0.04);
    // Every category on both sides is represented.
    const gCats = new Set(names.map((n) => n.given.category));
    const sCats = new Set(names.map((n) => n.surname.category));
    expect(gCats.size).toBe(4);
    expect(sCats.size).toBe(9);
  });

  it("stays fast over a long session", () => {
    const session = new NameSession(engine, createSeededRandom(5));
    run(session, 5_000);
    const t0 = performance.now();
    run(session, 1_000);
    const perName = (performance.now() - t0) / 1_000;
    expect(perName).toBeLessThan(2); // milliseconds
  });

  it("reports the full window when nothing had to be relaxed", () => {
    const session = new NameSession(engine, createSeededRandom(8));
    const results = Array.from({ length: 50 }, () => session.generate());
    results.forEach((r, i) => {
      expect(r.status).toBe("ok");
      if (r.status === "ok") expect(r.windowUsed).toBe(Math.min(i, HISTORY_WINDOW));
    });
  });
});

// ---------------------------------------------------------------------------
// Small fixtures for scarcity, relaxation and exhaustion.

const PLAIN_TEMPLATE: NameTemplate[] = [
  { id: "plain", description: "test", weight: 1, given: ["ordinary"], surname: ["household"] },
];

function tinyEngine(given: string[], surnames: string[]) {
  const corpus = buildCorpus({
    given: { ordinary: given },
    surnames: { household: surnames },
    barrelLeft: [],
    barrelRight: [],
  });
  return createEngine(corpus, PLAIN_TEMPLATE);
}

describe("scarcity and relaxation", () => {
  it("relaxes the oldest exclusions first and never the previous generation", () => {
    // 3 × 3 = 9 names, window 20: the full window can only be honoured for
    // the first 3 picks.
    const e = tinyEngine(["Gary", "Nora", "Hugo"], ["Kettle", "Ladle", "Trowel"]);
    for (let seed = 1; seed <= 30; seed++) {
      const s = new NameSession(e, createSeededRandom(seed));
      const names: GeneratedName[] = [];
      const windows: number[] = [];
      for (;;) {
        const r = s.generate();
        if (r.status === "exhausted") break;
        names.push(r.name);
        windows.push(r.windowUsed);
      }
      expect(names.length).toBeGreaterThanOrEqual(3);
      expect(names.length).toBeLessThanOrEqual(9);
      // Exhaustion is only reported when no unused name avoids both
      // components of the previous generation.
      const last = names[names.length - 1];
      const used = new Set(names.map((n) => n.id));
      for (const g of e.corpus.given) {
        for (const sn of e.corpus.surnames) {
          const id = `${g.id}|${sn.id}`;
          if (used.has(id) || !e.isEligible(g, sn)) continue;
          expect(g.id === last.given.id || sn.id === last.surname.id, id).toBe(true);
        }
      }
      for (let i = 1; i < names.length; i++) {
        expect(names[i].given.id).not.toBe(names[i - 1].given.id);
        expect(names[i].surname.id).not.toBe(names[i - 1].surname.id);
        // Whatever window was used, its whole span was honoured.
        const w = windows[i];
        expect(w).toBeGreaterThanOrEqual(1);
        const span = names.slice(i - w, i);
        expect(span.map((n) => n.given.id)).not.toContain(names[i].given.id);
        expect(span.map((n) => n.surname.id)).not.toContain(names[i].surname.id);
      }
      expect(new Set(names.map((n) => n.id)).size).toBe(names.length);
    }
  });

  it("chooses the widest window that still has a candidate", () => {
    // With 3 given × 3 surnames, after A1, B2 the only fully fresh pick is C3
    // (window 2). It must be chosen rather than relaxing.
    const e = tinyEngine(["Gary", "Nora", "Hugo"], ["Kettle", "Ladle", "Trowel"]);
    for (let seed = 1; seed <= 30; seed++) {
      const s = new NameSession(e, createSeededRandom(seed));
      const a = s.generate();
      const b = s.generate();
      const c = s.generate();
      if (a.status !== "ok" || b.status !== "ok" || c.status !== "ok") throw new Error();
      expect(b.windowUsed).toBe(1);
      expect(c.windowUsed).toBe(2);
      const usedGiven = [a.name.given.id, b.name.given.id];
      expect(usedGiven).not.toContain(c.name.given.id);
    }
  });

  it("exhausts gracefully when only previous-generation components remain", () => {
    // 2 × 2 = 4 names, but alternating rules mean only 2 can ever be emitted
    // back to back before every candidate repeats a component of the last.
    const e = tinyEngine(["Gary", "Nora"], ["Kettle", "Ladle"]);
    const s = new NameSession(e, createSeededRandom(1));
    const seen: string[] = [];
    for (let i = 0; i < 10; i++) {
      const r = s.generate();
      if (r.status === "exhausted") break;
      seen.push(r.name.id);
    }
    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(seen.length).toBeLessThanOrEqual(4);
    expect(new Set(seen).size).toBe(seen.length);
    // Once exhausted, it stays exhausted and never repeats.
    expect(s.generate().status).toBe("exhausted");
    expect(s.generate().status).toBe("exhausted");
  });

  it("returns exhausted immediately for an empty corpus", () => {
    const e = tinyEngine([], []);
    expect(new NameSession(e, createSeededRandom(1)).generate().status).toBe("exhausted");
  });

  it("handles a single possible name", () => {
    const e = tinyEngine(["Gary"], ["Kettle"]);
    const s = new NameSession(e, createSeededRandom(1));
    expect(s.generate().status).toBe("ok");
    expect(s.generate().status).toBe("exhausted");
  });

  it("falls back to scanning when sampling keeps missing", () => {
    // 40 given × 40 surnames; emit most of the space so random draws mostly
    // hit used names, forcing the deterministic scan.
    const letters = "bdfglmnprt";
    const pairs = Array.from({ length: 40 }, (_, i) => letters[i % 10] + letters[Math.floor(i / 10)]);
    const given = pairs.map((p) => `Ga${p}`);
    const surnames = pairs.map((p) => `Ko${p}`);
    const e = createEngine(
      buildCorpus({ given: { ordinary: given }, surnames: { household: surnames }, barrelLeft: [], barrelRight: [] }),
      PLAIN_TEMPLATE,
    );
    const s = new NameSession(e, createSeededRandom(4), 5);
    let ok = 0;
    for (;;) {
      const r = s.generate();
      if (r.status === "exhausted") break;
      ok++;
      if (ok > 2000) throw new Error("runaway");
    }
    let eligible = 0;
    for (const g of e.corpus.given) for (const sn of e.corpus.surnames) if (e.isEligible(g, sn)) eligible++;
    expect(eligible).toBeGreaterThan(1500);
    expect(ok).toBeGreaterThan(eligible * 0.95);
    expect(s.emittedCount).toBe(ok);
  });
});

describe("persistence", () => {
  it("restores a snapshot without repeating earlier names", () => {
    const s1 = new NameSession(engine, createSeededRandom(21));
    const first = run(s1, 200);
    const snap = JSON.parse(JSON.stringify(s1.snapshot()));
    const s2 = NameSession.restore(engine, createSeededRandom(21), snap);
    expect(s2.emittedCount).toBe(200);
    expect(s2.current?.id).toBe(first[199].id);
    const next = run(s2, 200);
    const firstIds = new Set(first.map((n) => n.id));
    for (const n of next) expect(firstIds.has(n.id)).toBe(false);
    // History window carries across the reload.
    const lastGiven = first.slice(-HISTORY_WINDOW).map((n) => n.given.id);
    expect(lastGiven).not.toContain(next[0].given.id);
  });

  it("ignores malformed or mismatched snapshots", () => {
    for (const bad of [null, 42, "x", { v: 2 }, { v: 1, corpusVersion: 999, emitted: [], recent: [] }]) {
      const s = NameSession.restore(engine, createSeededRandom(1), bad);
      expect(s.emittedCount).toBe(0);
    }
  });

  it("skips unknown IDs in a snapshot", () => {
    const s = NameSession.restore(engine, createSeededRandom(1), {
      v: 1,
      corpusVersion: engine.corpus.version,
      emitted: ["g:nobody|s:nothing"],
      recent: [["g:nobody", "s:nothing"]],
    });
    expect(s.emittedCount).toBe(0);
    expect(s.generate().status).toBe("ok");
  });
});
