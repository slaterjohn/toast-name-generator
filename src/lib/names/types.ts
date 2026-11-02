export type GivenCategory = "ordinary" | "oldFashioned" | "theatrical" | "eccentric";

export type SimpleSurnameCategory =
  | "household"
  | "food"
  | "commerce"
  | "motion"
  | "nature"
  | "grand"
  | "grounded"
  | "flamboyant";

export type SurnameCategory = SimpleSurnameCategory | "compound";

export type FragmentCategory = "barrelLeft" | "barrelRight";

/** Phonetic/rhythm tags derived from spelling. Heuristic, but stable and testable. */
export type PhoneticTag =
  | "monosyllable"
  | "polysyllable"
  | "plosive-onset"
  | "sibilant-onset"
  | "vowel-onset"
  | "vowel-ending"
  | "sibilant-ending";

interface ComponentBase {
  /** Canonical, stable ID. Used for all repetition checks. */
  id: string;
  /** Display text with original capitalisation. */
  text: string;
  /** Normalised comparison form (lower case, letters only, diacritics stripped). */
  norm: string;
  syllables: number;
  /** First letter of `norm`. */
  initial: string;
  tags: PhoneticTag[];
}

export interface GivenName extends ComponentBase {
  kind: "given";
  category: GivenCategory;
}

export interface Fragment extends ComponentBase {
  kind: "fragment";
  category: FragmentCategory;
}

export interface Surname extends ComponentBase {
  kind: "surname";
  category: SurnameCategory;
  /**
   * Normalised word tokens making up the surname. A simple surname has one;
   * a double-barrelled surname has two. Used for fragment-reuse checks.
   */
  tokens: string[];
}

export interface Corpus {
  version: number;
  given: GivenName[];
  surnames: Surname[];
  barrelLeft: Fragment[];
  barrelRight: Fragment[];
}

export interface NameTemplate {
  id: string;
  /** Short description of the comic pattern the template represents. */
  description: string;
  /** Relative selection weight (positive integer). */
  weight: number;
  given: readonly GivenCategory[];
  surname: readonly SurnameCategory[];
  /** When true, the surname must share the given name's initial letter. */
  alliterative?: boolean;
}

export interface GeneratedName {
  given: GivenName;
  surname: Surname;
  /** `${given.id}|${surname.id}` */
  id: string;
  display: string;
  norm: string;
  templateId: string;
}

/** Uniform 32-bit random source. Inject a seeded one for deterministic tests. */
export interface RandomSource {
  nextUint32(): number;
}
