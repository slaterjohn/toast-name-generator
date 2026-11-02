import { isExcludedFullName } from "./exclusions";
import type { Fragment, GivenName, Surname } from "./types";

/**
 * Quality rules. All configurable here, none in the UI.
 */
export const QUALITY_RULES = {
  /** Longest acceptable full name, in estimated syllables. */
  maxFullNameSyllables: 7,
  /** Longest acceptable double-barrelled surname, in estimated syllables. */
  maxCompoundSyllables: 5,
  /** Right-hand barrel must be short and blunt. */
  maxRightBarrelSyllables: 2,
  /** Two words sharing this many trailing letters count as a rhyme. */
  rhymeSuffixLength: 3,
  /** Two words sharing this many leading letters sound like a stutter (Ivor Ivory). */
  stutterPrefixLength: 4,
} as const;

function sharesSuffix(a: string, b: string, n: number): boolean {
  return a.length >= n && b.length >= n && a.slice(-n) === b.slice(-n);
}

function sharesPrefix(a: string, b: string, n: number): boolean {
  return a.length >= n && b.length >= n && a.slice(0, n) === b.slice(0, n);
}

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);

/**
 * Can these two fragments form a believable double-barrelled surname?
 */
export function isCompatibleCompound(left: Fragment, right: Fragment): boolean {
  const r = QUALITY_RULES;
  if (left.norm === right.norm) return false;
  if (right.syllables > r.maxRightBarrelSyllables) return false;
  if (left.syllables + right.syllables > r.maxCompoundSyllables) return false;
  if (sharesSuffix(left.norm, right.norm, r.rhymeSuffixLength)) return false;
  // One word contained in the other reads as a typo (Lambert-Lamb).
  if (left.norm.includes(right.norm) || right.norm.includes(left.norm)) return false;
  return true;
}

/**
 * Can this given name and surname stand together? Template membership is
 * checked separately; this covers sound, length and exclusions.
 */
export function isCompatiblePair(given: GivenName, surname: Surname): boolean {
  const r = QUALITY_RULES;
  if (surname.tokens.includes(given.norm)) return false;
  if (given.syllables + surname.syllables > r.maxFullNameSyllables) return false;

  const lastToken = surname.tokens[surname.tokens.length - 1];
  const firstToken = surname.tokens[0];
  if (sharesSuffix(given.norm, lastToken, r.rhymeSuffixLength)) return false;
  if (sharesPrefix(given.norm, firstToken, r.stutterPrefixLength)) return false;
  if (firstToken.startsWith(given.norm) || given.norm.startsWith(firstToken)) return false;

  // The same consonant either side of the gap slurs the two words together
  // when said aloud (Les Sprat, Ned Dodds).
  const boundaryEnd = given.norm[given.norm.length - 1];
  if (boundaryEnd === surname.initial && !VOWELS.has(boundaryEnd)) return false;

  if (isExcludedFullName(`${given.norm} ${surname.norm}`)) return false;
  return true;
}
