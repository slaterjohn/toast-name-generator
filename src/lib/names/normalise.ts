/**
 * Comparison form for names: NFKD, diacritics stripped, lower-cased with a
 * locale-independent mapping, everything except letters, spaces and hyphens
 * removed, whitespace collapsed.
 */
export function normaliseName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\s-]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Single-word comparison form: letters only. */
export function normaliseToken(value: string): string {
  return normaliseName(value).replace(/[\s-]+/g, "");
}
