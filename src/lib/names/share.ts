import { resolveName, type NameEngine } from "./generator";
import type { GeneratedName } from "./types";

/**
 * Share links encode the generated output, never anything a person typed:
 * `?n=cyril.pemberton-pugh`. The code is the given name's normalised form, a
 * dot, then the surname's normalised form (a double-barrel keeps its hyphen).
 */
export const SHARE_PARAM = "n";

const CODE_PATTERN = /^([a-z]+)\.([a-z]+)(?:-([a-z]+))?$/;

export function shareCode(name: GeneratedName): string {
  return `${name.given.norm}.${name.surname.norm}`;
}

/** Decode a share code. Returns null for malformed codes or names the engine would not emit. */
export function decodeShareCode(engine: NameEngine, code: string | null | undefined): GeneratedName | null {
  if (!code || code.length > 80) return null;
  const match = CODE_PATTERN.exec(code);
  if (!match) return null;
  const [, given, first, second] = match;
  const surnameId = second ? `c:${first}~${second}` : `s:${first}`;
  return resolveName(engine, `g:${given}|${surnameId}`);
}

/** Absolute share URL for a name, based on the current page's origin and path. */
export function shareUrl(name: GeneratedName, base: string): string {
  const url = new URL(base);
  url.search = "";
  url.hash = "";
  url.searchParams.set(SHARE_PARAM, shareCode(name));
  return url.toString();
}
