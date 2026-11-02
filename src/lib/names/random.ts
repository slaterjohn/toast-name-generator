import type { RandomSource } from "./types";

const TWO_32 = 0x1_0000_0000;

/**
 * Unbiased integer in [0, n) using rejection sampling, so small pools are not
 * skewed by a naive `x % n`. Rejection probability is below 50% per draw; after
 * 64 consecutive rejections (only possible with a broken source) it falls back
 * to modulo rather than spinning forever.
 */
export function randomInt(rng: RandomSource, n: number): number {
  if (!Number.isInteger(n) || n <= 0) {
    throw new RangeError(`randomInt: n must be a positive integer, got ${n}`);
  }
  if (n === 1) return 0;
  const limit = TWO_32 - (TWO_32 % n);
  let x = rng.nextUint32();
  for (let i = 0; i < 64 && x >= limit; i++) x = rng.nextUint32();
  return x % n;
}

/** Pick an index according to positive integer weights. */
export function weightedIndex(rng: RandomSource, weights: readonly number[]): number {
  let total = 0;
  for (const w of weights) total += w;
  let r = randomInt(rng, total);
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

/**
 * Cryptographically secure randomness from the Web Crypto API (browsers and
 * Node 19+), buffered to avoid a call per draw. Falls back to Math.random only
 * if no Web Crypto implementation exists.
 */
export function createCryptoRandom(): RandomSource {
  const cryptoObj: Crypto | undefined = globalThis.crypto;
  if (!cryptoObj?.getRandomValues) {
    return { nextUint32: () => Math.floor(Math.random() * TWO_32) >>> 0 };
  }
  const buffer = new Uint32Array(128);
  let index = buffer.length;
  return {
    nextUint32() {
      if (index >= buffer.length) {
        cryptoObj.getRandomValues(buffer);
        index = 0;
      }
      return buffer[index++];
    },
  };
}

/**
 * Deterministic PRNG (sfc32 seeded through splitmix32). Used for tests and
 * reproducible stress runs. Not for anything security-related.
 */
export function createSeededRandom(seed: number): RandomSource {
  let s = seed >>> 0;
  const splitmix = () => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    return (z ^ (z >>> 16)) >>> 0;
  };
  let a = splitmix();
  let b = splitmix();
  let c = splitmix();
  let d = splitmix();
  const next = () => {
    const t = (((a + b) >>> 0) + d) >>> 0;
    d = (d + 1) >>> 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) >>> 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) >>> 0;
    return t >>> 0;
  };
  for (let i = 0; i < 12; i++) next();
  return { nextUint32: next };
}
