# Phase 2: personalised names, sharing and name cards

Status: **implemented** (mapping version 1).

| Piece | Code |
| --- | --- |
| Canonicalisation | `src/lib/names/canonicalise.ts` |
| SHA-256 and UTF-8 | `src/lib/names/sha256.ts` |
| Deterministic mapping and version registry | `src/lib/names/deterministic.ts` |
| Share codes | `src/lib/names/share.ts` |
| Name card | `src/lib/name-card.ts` |
| Form, share and card controls | `src/components/personalised-name-form.tsx`, `src/components/share-controls.tsx` |
| Frozen test vectors | `tests/names/personal-vectors.v1.json` |

## What it does

1. A form with one free-text field labelled **Your name**. There are no separate first-name and surname fields.
2. The same entered name always produces the same Toast name, on any browser, now and in future releases.
3. **Share link** copies (or, on touch devices, opens the system share sheet with) a link that encodes only the generated name.
4. **Download card** saves a 1200 × 630 PNG of the displayed name, drawn in the browser.

## Input

The whole string is the input. It may be a single word, a full name, several middle names, or contain hyphens, apostrophes, diacritics or non-Latin scripts. The app does not try to work out which part is a first name or surname.

Validation, shown inline under the field: the input must contain at least one letter or number after canonicalisation, and be at most 200 characters.

## Privacy

- The input is held only in the form component's React state.
- It is never written to cookies, localStorage, sessionStorage, the URL, history state, analytics, logs or any request. The app has no analytics and no network calls.
- The input has no `name` attribute, so even a form submitted without JavaScript sends nothing. Autocomplete, autocorrect and spellcheck are off.
- Neither the input nor the result is saved automatically. Favouriting the result is an explicit action and stores only the generated name.
- Privacy statement under the field: "The same name always gets the same Toast name. Your name stays on this device. It isn't stored or sent anywhere."

## Canonicalisation (version 1, frozen)

Applied in this order:

1. Unicode NFKC normalisation.
2. Apostrophe variants (U+2018, U+2019, U+02BC, U+0060, U+00B4) become U+0027. Hyphen, dash and minus variants (U+2010–U+2015, U+2212, U+FE63, U+FF0D) become U+002D.
3. Every run of whitespace becomes a single space, then leading and trailing space is trimmed.
4. Lower case without locale rules: Turkish İ (U+0130) becomes `i` first, so it leaves no combining dot behind; then `toLowerCase()`; then every final sigma (ς) becomes σ, so a sigma's position in the word never matters.

Diacritics are kept, so *José* and *Jose* map to different names. Those are different inputs, and stripping accents would treat many names in non-Latin scripts badly. Different Unicode encodings of the same text (composed or decomposed é) match, because of step 1.

## Seed derivation

```
message = "toast-name-generator/personal/v1" + U+0000 + canonical
digest  = SHA-256(UTF-8(message))
```

SHA-256 is implemented in plain TypeScript along with its own UTF-8 encoder. Web Crypto's `subtle.digest` would have been the obvious choice, but it is unavailable outside secure contexts (a plain-HTTP LAN or tailnet address) and it is asynchronous. The implementation is tested against published vectors and against Node's `crypto` for 200+ strings, and the UTF-8 encoder against `TextEncoder`, including lone surrogates.

The digest gives four 64-bit big-endian values:

| Bytes | Stream |
| --- | --- |
| 0–7 | template |
| 8–15 | given name within its category |
| 16–23 | surname within its group |
| 24–31 | categories: high 32 bits pick the given-name category, low 32 bits the surname group |

A 64-bit value `x` maps onto `[0, n)` as `floor(x × n / 2⁶⁴)`, computed with `BigInt`. The 32-bit category values use `floor(x × n / 2³²)`. With pools of a few thousand, the bias is far below anything measurable.

## Selection

1. **Template:** map the template stream onto the cumulative template weights, in the order of `TEMPLATES`.
2. **Given name:** take the template's given-name categories that have entries, in template order; pick one with the given-category stream, then a name from it (corpus order) with the given-name stream.
3. **Surname:** build the template's surname groups for that given name: one group per surname category in template order, containing only surnames that pass `isCompatiblePair` (double-barrels also pass the compound rules, in `left × right` order), with empty groups dropped. The alliterative template has one group of same-initial simple surnames. Pick a group with the surname-category stream, then a surname with the surname stream.
4. If the template yields no given names or no surnames for that given name, try the next template in order with the same streams.

Picking a category before an entry mirrors random mode. Without it, 9,000 double-barrels would swamp 97 grand surnames in the pompous template. Measured over 5,000 inputs, 13% of personalised names have a double-barrelled surname (random mode: 14%) and every template's share is within ±40% of its weight share.

Personalised output therefore obeys every quality rule and exclusion that random output does. The 20-generation history rules do not apply, because they would make the mapping depend on what else had been generated.

Each mapping takes about 0.5 ms in Node.

## Versioning

- A mapping version pins its canonicalisation version, corpus, templates, quality rules and exclusion lists. The registry lives in `deterministic.ts` (`MAPPING_VERSIONS`).
- Version 1 records a SHA-256 **fingerprint** of everything that affects it (every corpus entry with its category, in order; the templates; `QUALITY_RULES`; all exclusion lists). A test fails if the live data no longer matches.
- **When that test fails, do not update the v1 fingerprint.** Copy the v1 banks into a frozen module (for example `corpus-data-v1.ts`), point the v1 registry entry at it, add a v2 entry for the new data, and generate a v2 vector file. Existing names are never silently reassigned.
- The frozen vector test (50 inputs: ASCII, diacritics, Turkish, Greek, Cyrillic, CJK, Korean, Arabic, Hebrew, Devanagari, Welsh, Irish, Vietnamese, punctuation, a 200-character string) also catches changes to compatibility code that the fingerprint cannot see.

## Sharing

- Share links encode the output, never the input: `?n=<given>.<surname>`, for example `?n=cyril.kettle` or `?n=sarah.bellamy-knott`. The code is the normalised given name, a dot, and the normalised surname (a double-barrel keeps its hyphen).
- Opening a link shows that name labelled "A name shared with you". Unknown or ineligible codes are ignored with a short message, and the parameter is removed from the address bar.
- The share parameter is removed (with `history.replaceState`, no reload or scroll) as soon as someone regenerates or reveals their own name.
- On touch devices with the Web Share API, **Share link** opens the system share sheet. Everywhere else it copies the link.
- A share link is a pointer to a generated name, not to a person. It cannot be reversed into whatever was typed, because it was never derived from the input: the same link is produced for anyone who lands on that name by any route.

## Name card

`renderNameCard` draws on a `<canvas>` using the page's own self-hosted fonts (read from the `--font-display` and `--font-ui` custom properties, after `document.fonts.ready`), shrinking and wrapping long names to fit. It exports a PNG through `canvas.toBlob` and downloads it from a blob URL named `toast-name-<name>.png`. The module loads only when someone presses **Download card**.

## Security note

Deterministic mapping is a toy, not an identity mechanism. Anyone who knows or guesses a person's name can reproduce their Toast name. Collisions between different names are expected and acceptable. Nothing should treat a personalised name as secret, unique or verified.

## Tests

| Requirement | Test |
| --- | --- |
| Equivalent inputs give identical names | `tests/names/personal.test.ts`; `tests/e2e/personal.spec.ts` |
| Same results across browsers | the frozen vectors run in Node, Chromium and Firefox (Playwright), and in JavaScriptCore, Safari's engine (`npm run test:jsc`) |
| Unicode, punctuation and whitespace | canonicalisation tests and the vector set |
| Mappings don't change between releases | frozen vectors plus the v1 fingerprint |
| Versioned corpora preserve mappings | registry test with an altered corpus |
| Output obeys quality rules and exclusions | 3,000-input distribution test |
| No personal data stored or sent | component test; Playwright test that types a name, reveals, favourites, shares, downloads a card and reloads, then checks every storage area, cookies, the URL and every request |

### WebKit

Playwright's bundled WebKit crashes on launch on this macOS release (segmentation fault in the browser binary, not the app), so the WebKit project is opt-in with `E2E_WEBKIT=1`. `npm run test:jsc` covers the part that matters for determinism by running the same 50 vectors in JavaScriptCore, the engine Safari uses. The UI itself has not been exercised in Safari by automation.
