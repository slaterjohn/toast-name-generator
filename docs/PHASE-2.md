# Phase 2: personalised names (design contract)

Status: **designed, not implemented.** Nothing in this document ships in the MVP. It records the decisions the MVP's architecture was built to support, so Phase 2 can be added without reworking the engine.

## What it adds

1. A form with one free-text field labelled **Your name**. Not separate first-name and surname fields.
2. The same entered name always produces the same Toast name, on any browser, now and in future releases.
3. Shareable results that never contain the person's real name.
4. Optionally, a downloadable name card and share controls.

## Input

The whole string is the input. It may be a single word, a full name, several middle names, or contain hyphens, apostrophes, diacritics or non-Latin scripts. The app does not try to work out which part is a first name or surname.

Empty input after canonicalisation is rejected with an inline error. A sensible length cap (200 characters) prevents pathological input.

## Privacy

- The input never leaves the browser and is processed only in memory.
- It is never written to cookies, localStorage, sessionStorage, URLs, analytics, logs or any request.
- Neither the input nor the personalised result is saved automatically. Saving the result as a favourite is an explicit action and stores only the generated name.
- The form uses `autocomplete="off"`, and the result view does not echo the input back into the URL or history state.
- Privacy statement shown beside the field: "Your name stays on this device. It isn't stored or sent anywhere."

## Canonicalisation (version 1)

Applied in this order, implemented in `src/lib/names/canonicalise.ts`:

1. Unicode NFKC normalisation.
2. Trim leading and trailing whitespace (Unicode `White_Space`).
3. Collapse every run of internal whitespace to a single U+0020 space.
4. Case-fold with `String.prototype.toLowerCase()` followed by a fixed table for the few characters whose lower-casing differs by locale (Turkish dotted/dotless I, final sigma). No `toLocaleLowerCase`.
5. Normalise common punctuation variants: typographic apostrophes (U+2018, U+2019, U+02BC) to U+0027; the various hyphens and dashes (U+2010–U+2015, U+2212) to U+002D.

Diacritics are kept, so *José* and *Jose* map to different names. Those really are different inputs, and stripping accents would treat many non-Latin-script names badly. Equivalent spellings that differ only in Unicode composition still match, because of step 1.

The procedure is versioned. Changing any step creates canonicalisation v2, which only applies to a new corpus/algorithm version (below).

## Seed derivation

```
message = "toast-name-generator/personal/v1\u0000" + canonical
digest  = SHA-256(UTF-8(message))           // Web Crypto subtle.digest
```

SHA-256 is specified identically everywhere, so results do not depend on the browser or JavaScript engine. It is not used for secrecy (see below), only for stability and good mixing.

Independent streams come from fixed, non-overlapping slices of the digest:

| Bytes | Use |
| --- | --- |
| 0–7 | template selection |
| 8–15 | given-name selection |
| 16–23 | surname selection |
| 24–31 | reserved (tie-breaks, future use) |

Each slice is read as a big-endian 64-bit unsigned integer `x`. To pick from `n` options without modulo bias, use `floor(x × n / 2⁶⁴)` computed with `BigInt`. The bias of this method with 64-bit input and pools of a few thousand is below 10⁻¹².

## Selection

1. Template: map stream 0 onto cumulative template weights.
2. Given name: list the template's given names in a fixed order (category order from the template, then corpus order) and pick with stream 1.
3. Surname: build the template's eligible surname list for that given name in a fixed order (category order, then corpus order; compounds in `left × right` index order), filtered by `isCompatiblePair`, the compound rules and exclusions. Pick with stream 2.
4. If the eligible list is empty (rare: a given name whose rules reject every surname), move to the next template in fixed order and retry with the same streams.

Personalised output therefore obeys every quality rule and exclusion that random output does. The 20-generation history rules do not apply; they would make the mapping depend on what else had been generated.

## Versioning

- Every released personalised mapping is identified by `(algorithmVersion, corpusVersion)`, starting at `(1, 1)`.
- The corpus used for personalised names is a frozen snapshot. `CORPUS_VERSION` in `src/lib/names/corpus.ts` already exists for this.
- Changing the random-mode corpus does not change personalised results: the personalised path keeps reading the frozen v1 snapshot until a deliberate migration.
- A future version may become the default for *new* lookups only if the old version stays available and the UI explains the change. Existing mappings are never silently reassigned.

## Sharing

- Shared links never contain the real name, its canonical form or its hash. A hash of a name is easy to reverse by guessing common names.
- A shareable result is encoded by output, not input: `/?n=<givenId>.<surnameId>` (for example `/?n=cyril.c-pemberton~pugh`), versioned with the corpus. Anyone opening the link sees that generated name. It says nothing about who generated it.
- The share URL is created only when the person presses **Share**, never automatically.
- Name cards are drawn client-side on a `<canvas>` from the generated name only, and downloaded as PNG through a blob URL.

## Security note

Deterministic mapping is a toy, not an identity mechanism. Anyone who knows or guesses a person's name can reproduce their Toast name. Collisions between different names are expected and acceptable. Nothing should treat a personalised name as secret, unique or verified.

## Tests required for Phase 2

- Frozen test vectors: about 50 inputs (ASCII, diacritics, CJK, Arabic, Cyrillic, hyphens, apostrophes, extra whitespace, mixed case, composed vs decomposed Unicode) with their expected outputs, checked into the repo and run on every build.
- The same vectors run in Chromium, Firefox and WebKit through Playwright, compared with the Node results.
- Equivalence classes: inputs differing only in whitespace, case or Unicode composition produce the same name.
- Every personalised output passes `isEligible` and the exclusion checks.
- A versioning test: building a modified corpus does not change v1 vector results.
- Privacy: a Playwright test enters a name, generates, favourites, shares and reloads, then asserts the input string appears in no storage area, no URL, no cookie and no network request.
