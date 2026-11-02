import { canonicaliseName, CANONICALISATION_VERSION } from "./canonicalise";
import { isCompatibleCompound, isCompatiblePair, QUALITY_RULES } from "./compatibility";
import { getDefaultCorpus, makeCompound } from "./corpus";
import {
  EXCLUDED_FULL_NAMES,
  EXCLUDED_GIVEN,
  EXCLUDED_SURNAME_TOKENS,
} from "./exclusions";
import { createEngine, type NameEngine } from "./generator";
import { normaliseName } from "./normalise";
import { sha256Utf8, toHex } from "./sha256";
import { TEMPLATES } from "./templates";
import type { GeneratedName, GivenName, NameTemplate, Surname } from "./types";

/**
 * Personalised (deterministic) names. See docs/PHASE-2.md for the contract.
 *
 * The same canonical input always maps to the same name for a given mapping
 * version. Released versions are frozen: their corpus, templates, quality
 * rules and exclusions are pinned by a fingerprint that the test suite
 * checks, so an edit to the live word banks cannot silently reassign
 * anyone's name.
 */
export const CURRENT_MAPPING_VERSION = 1;

interface MappingVersion {
  version: number;
  canonicalisation: number;
  /** SHA-256 over everything that can influence the mapping. */
  fingerprint: string;
  engine: () => NameEngine;
}

let v1Engine: NameEngine | null = null;

const MAPPING_VERSIONS: Record<number, MappingVersion> = {
  1: {
    version: 1,
    canonicalisation: 1,
    fingerprint: "83238af72c9aa6d2521ea16af5b83e75873203873bc65ee7f74b152ed6376249",
    engine: () => (v1Engine ??= createEngine(getDefaultCorpus(), TEMPLATES)),
  },
};

/**
 * Fingerprint of an engine's mapping inputs: every corpus entry (text and
 * category, in order), the templates, the quality rules and the exclusion
 * lists. Any change to these changes the fingerprint.
 */
export function mappingFingerprint(engine: NameEngine): string {
  const { corpus } = engine;
  const payload = JSON.stringify({
    corpusVersion: corpus.version,
    given: corpus.given.map((g) => [g.text, g.category]),
    surnames: corpus.surnames.map((s) => [s.text, s.category]),
    barrelLeft: corpus.barrelLeft.map((f) => f.text),
    barrelRight: corpus.barrelRight.map((f) => f.text),
    templates: engine.templates,
    rules: QUALITY_RULES,
    excluded: [EXCLUDED_FULL_NAMES, EXCLUDED_GIVEN, EXCLUDED_SURNAME_TOKENS],
  });
  return toHex(sha256Utf8(payload));
}

export function getMappingVersion(version: number = CURRENT_MAPPING_VERSION): MappingVersion {
  const entry = MAPPING_VERSIONS[version];
  if (!entry) throw new RangeError(`Unknown personalised mapping version ${version}`);
  return entry;
}

const TWO_64 = BigInt(1) << BigInt(64);

/** Read 8 bytes as a big-endian unsigned 64-bit integer. */
function readUint64(bytes: Uint8Array, offset: number): bigint {
  let x = BigInt(0);
  for (let i = 0; i < 8; i++) x = (x << BigInt(8)) | BigInt(bytes[offset + i]);
  return x;
}

/** floor(x × n / 2^64): maps a 64-bit value onto [0, n) with negligible bias. */
function scale(x: bigint, n: number): number {
  return Number((x * BigInt(n)) / TWO_64);
}

const TWO_32 = BigInt(1) << BigInt(32);

/** floor(x × n / 2^32) for a 32-bit value; used for picking among a handful of categories. */
function scale32(x: bigint, n: number): number {
  return Number((x * BigInt(n)) / TWO_32);
}

/** Given-name categories of a template that have entries, in template order. */
function givenGroups(engine: NameEngine, t: NameTemplate): GivenName[][] {
  return t.given
    .map((cat) => engine.corpus.given.filter((g) => g.category === cat))
    .filter((list) => list.length > 0);
}

/**
 * Eligible surnames for this given name, grouped as random mode groups them:
 * one group per template category (in template order), or a single group of
 * same-initial simple surnames for the alliterative template. Empty groups
 * are dropped. Entries within a group are in corpus order.
 */
function surnameGroups(engine: NameEngine, t: NameTemplate, g: GivenName): Surname[][] {
  const { corpus } = engine;
  if (t.alliterative) {
    const list = t.surname.flatMap((cat) =>
      corpus.surnames.filter(
        (s) => s.category === cat && s.initial === g.initial && isCompatiblePair(g, s),
      ),
    );
    return list.length > 0 ? [list] : [];
  }
  const groups: Surname[][] = [];
  for (const cat of t.surname) {
    const list: Surname[] = [];
    if (cat === "compound") {
      for (const left of corpus.barrelLeft) {
        for (const right of corpus.barrelRight) {
          if (!isCompatibleCompound(left, right)) continue;
          const s = makeCompound(left, right);
          if (isCompatiblePair(g, s)) list.push(s);
        }
      }
    } else {
      for (const s of corpus.surnames) {
        if (s.category === cat && isCompatiblePair(g, s)) list.push(s);
      }
    }
    if (list.length > 0) groups.push(list);
  }
  return groups;
}

/** The digest the mapping is derived from. Exposed for documentation and tests. */
export function personalDigest(canonical: string, version: number = CURRENT_MAPPING_VERSION): Uint8Array {
  return sha256Utf8(`toast-name-generator/personal/v${version}\u0000${canonical}`);
}

/**
 * Map an entered name to its Toast name. Returns null if the input is empty
 * after canonicalisation. Nothing is stored or sent anywhere.
 */
export function personalisedName(
  input: string,
  version: number = CURRENT_MAPPING_VERSION,
  engineOverride?: NameEngine,
): GeneratedName | null {
  const mapping = getMappingVersion(version);
  if (mapping.canonicalisation !== CANONICALISATION_VERSION) {
    throw new Error(`Mapping v${version} needs canonicalisation v${mapping.canonicalisation}`);
  }
  const canonical = canonicaliseName(input);
  if (!canonical) return null;

  const engine = engineOverride ?? mapping.engine();
  const digest = personalDigest(canonical, version);
  const templateStream = readUint64(digest, 0);
  const givenStream = readUint64(digest, 8);
  const surnameStream = readUint64(digest, 16);
  const categoryStream = readUint64(digest, 24);
  const givenCategoryStream = categoryStream >> BigInt(32);
  const surnameCategoryStream = categoryStream & BigInt(0xffffffff);

  const templates = engine.templates;
  const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
  let r = scale(templateStream, totalWeight);
  let start = 0;
  while (r >= templates[start].weight) {
    r -= templates[start].weight;
    start++;
  }

  for (let k = 0; k < templates.length; k++) {
    const t = templates[(start + k) % templates.length];
    const gGroups = givenGroups(engine, t);
    if (gGroups.length === 0) continue;
    const gList = gGroups[scale32(givenCategoryStream, gGroups.length)];
    const g = gList[scale(givenStream, gList.length)];
    const sGroups = surnameGroups(engine, t, g);
    if (sGroups.length === 0) continue;
    const sList = sGroups[scale32(surnameCategoryStream, sGroups.length)];
    const s = sList[scale(surnameStream, sList.length)];
    const display = `${g.text} ${s.text}`;
    return {
      given: g,
      surname: s,
      id: `${g.id}|${s.id}`,
      display,
      norm: normaliseName(display),
      templateId: t.id,
    };
  }
  return null;
}
