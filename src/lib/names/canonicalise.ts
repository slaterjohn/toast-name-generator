/**
 * Canonical form of a person's entered name for personalised generation.
 *
 * VERSION 1 — frozen. Any change to these steps must become version 2 and
 * ship alongside a new personalised-mapping version (see docs/PHASE-2.md).
 *
 * 1. Unicode NFKC normalisation.
 * 2. Typographic apostrophes (U+2018, U+2019, U+02BC, U+0060, U+00B4) → U+0027.
 *    Hyphens, dashes and minus (U+2010–U+2015, U+2212, U+FE63, U+FF0D) → U+002D.
 * 3. Trim, and collapse every run of whitespace to one U+0020 space.
 * 4. Locale-independent lower case: Turkish İ (U+0130) → "i" before
 *    toLowerCase(), so it does not leave a combining dot behind; every sigma
 *    (including final ς) → σ afterwards, so position in a word never matters.
 *
 * Diacritics are kept: "José" and "Jose" are different inputs. Different
 * Unicode encodings of the same text ("é" composed or decomposed) match.
 */
export const CANONICALISATION_VERSION = 1;

/** Longest accepted input, in code points, after canonicalisation. */
export const MAX_NAME_LENGTH = 200;

export function canonicaliseName(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[‐-―−﹣－]/g, "-")
    .replace(/\s+/gu, " ")
    .trim()
    .replace(/İ/g, "i")
    .toLowerCase()
    .replace(/ς/g, "σ");
}

export type NameInputProblem = "empty" | "too-long" | "no-letters";

/** Validate an entered name. Returns null when it is usable. */
export function checkNameInput(input: string): NameInputProblem | null {
  const canonical = canonicaliseName(input);
  if (canonical.length === 0) return "empty";
  if ([...canonical].length > MAX_NAME_LENGTH) return "too-long";
  if (!/[\p{L}\p{N}]/u.test(canonical)) return "no-letters";
  return null;
}
