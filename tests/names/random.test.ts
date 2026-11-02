import { describe, expect, it } from "vitest";
import { createCryptoRandom, createSeededRandom, randomInt, weightedIndex } from "@/lib/names/random";
import type { RandomSource } from "@/lib/names/types";

describe("randomness", () => {
  it("seeded source is deterministic", () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    const xs = Array.from({ length: 10 }, () => a.nextUint32());
    const ys = Array.from({ length: 10 }, () => b.nextUint32());
    expect(xs).toEqual(ys);
    expect(new Set(xs).size).toBe(10);
  });

  it("crypto source produces 32-bit integers", () => {
    const rng = createCryptoRandom();
    for (let i = 0; i < 300; i++) {
      const x = rng.nextUint32();
      expect(Number.isInteger(x)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(2 ** 32);
    }
  });

  it("randomInt rejects values that would cause modulo bias", () => {
    // n = 3 * 2^30: naive modulo would over-weight [0, 2^30). The top 2^30
    // values must be rejected and redrawn.
    const n = 3 * 2 ** 30;
    const values = [2 ** 32 - 1, 2 ** 32 - 2, 5];
    let i = 0;
    const rng: RandomSource = { nextUint32: () => values[i++] };
    expect(randomInt(rng, n)).toBe(5);
    expect(i).toBe(3);
  });

  it("randomInt is close to uniform for an awkward n", () => {
    const rng = createSeededRandom(7);
    const n = 7;
    const buckets = new Array(n).fill(0);
    const draws = 70_000;
    for (let i = 0; i < draws; i++) buckets[randomInt(rng, n)]++;
    for (const b of buckets) expect(Math.abs(b - draws / n)).toBeLessThan(draws / n * 0.05);
  });

  it("randomInt terminates even with a stuck source", () => {
    const rng: RandomSource = { nextUint32: () => 2 ** 32 - 1 };
    expect(() => randomInt(rng, 3)).not.toThrow();
  });

  it("weightedIndex respects weights", () => {
    const rng = createSeededRandom(3);
    const counts = [0, 0, 0];
    for (let i = 0; i < 30_000; i++) counts[weightedIndex(rng, [1, 2, 7])]++;
    expect(counts[0] / 30_000).toBeCloseTo(0.1, 1);
    expect(counts[1] / 30_000).toBeCloseTo(0.2, 1);
    expect(counts[2] / 30_000).toBeCloseTo(0.7, 1);
  });

  it("randomInt validates its argument", () => {
    const rng = createSeededRandom(1);
    expect(() => randomInt(rng, 0)).toThrow(RangeError);
    expect(() => randomInt(rng, 2.5)).toThrow(RangeError);
  });
});
