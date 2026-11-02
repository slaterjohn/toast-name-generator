# Naming engine

The engine lives in `src/lib/names/`. It is plain TypeScript with no React or DOM dependency, so it runs the same in the browser, in Node and in tests.

## Style analysis

The show's names were studied, not reused. What makes them work:

- **An ordinary first name carrying an ordinary noun as a surname.** The noun is everyday and slightly deflating rather than silly.
- **Grand or double-barrelled surnames** with a believable rhythm, often a weighty left half and a short blunt right half.
- **An odd given name anchored by a plain surname**, so the oddity lands.
- **Sound.** Plosive starts, clean stress patterns, occasional alliteration.
- **Restraint.** Most of the names are almost credible. The joke is in the pairing, delivered straight.

The engine encodes these as weighted templates over curated banks, then filters every pairing through sound and length rules.

## Corpus (version 1)

| Bank | Entries | Purpose |
| --- | ---: | --- |
| Given: ordinary | 121 | Gary, Sharon, Gavin |
| Given: old-fashioned | 85 | Cyril, Mavis, Desmond |
| Given: theatrical | 78 | Peregrine, Araminta, Horatio |
| Given: eccentric | 87 | Torquil, Hepzibah, Bram |
| **Given total** | **371** | |
| Surname: household | 148 | Kettle, Gusset, Hatstand |
| Surname: food | 111 | Crumpet, Gammon, Blancmange |
| Surname: commerce | 107 | Invoice, Codicil, Overdraft |
| Surname: motion | 75 | Trundle, Dither, Flounce |
| Surname: nature | 120 | Stoat, Bracken, Turbot |
| Surname: grand | 97 | Fotheringham, Ponsonby, Lovelace |
| Surname: grounded | 99 | Ackroyd, Gledhill, Nuttall |
| Surname: flamboyant | 101 | Tarantella, Kerfuffle, Brocade |
| **Simple surname total** | **858** | |
| Barrel left | 107 | Clutterbuck, Sparrowhawk, Custard |
| Barrel right | 87 | Pugh, Fitch, Thrupp |
| **Valid double-barrelled surnames** | **9,274** | after compound rules (of 9,309 raw) |

Run `npm run report` for current figures. Category sizes change whenever the banks do.

Each entry carries metadata computed when the corpus is built: a canonical ID (`g:cyril`, `s:kettle`, `c:clutterbuck~pugh`), a normalised comparison form, an estimated syllable count, its initial letter and phonetic tags (`monosyllable`, `plosive-onset`, `sibilant-ending` and so on).

## Templates

| Template | Weight | Given categories | Surname categories |
| --- | ---: | --- | --- |
| ordinary-incongruous | 26 | ordinary, old-fashioned | household, food, nature, commerce |
| pompous | 16 | theatrical, old-fashioned | grand, compound |
| eccentric-grounded | 14 | eccentric | grounded |
| flamboyant | 12 | ordinary, eccentric, theatrical | flamboyant |
| dry-wordplay | 10 | ordinary, theatrical, old-fashioned | commerce, motion |
| surreal | 10 | theatrical, eccentric | household, food, nature, motion |
| barrelled-everyman | 6 | ordinary, eccentric | compound |
| alliterative | 6 | any | any simple surname with the same initial |

Selection: pick a template by weight, then a category uniformly from each side, then an entry uniformly within that category. Choosing by category first stops a large bank from drowning out a small, flavourful one.

## Quality rules

`compatibility.ts` holds all rules as constants:

- Full name at most 7 estimated syllables.
- No rhyming pairs (shared last three letters): no *Clive Olive*.
- No stutters (shared first four letters, or one name a prefix of the other): no *Ivor Ivory*.
- No identical consonant either side of the gap, which slurs when spoken: no *Les Sprat*.
- The given name may not appear inside the surname.
- Double-barrels: right half at most 2 syllables, whole surname at most 5, no shared endings, neither half contained in the other.
- Exclusions (below).

## Exclusions

`exclusions.ts` keeps three lists:

- **Full names** (about 110): every Toast character name found in research, the people behind the shows, and well-known British comedy and television names, real and fictional, that could plausibly be assembled from the banks.
- **Given names**: Clem, Steven.
- **Surname tokens**: Toast, Fandango, Purchase, Plough, Howzer, Bear, Berry, Mathews, Black. These are blocked as whole surnames and as either half of a double-barrel.

Excluded components are dropped when the corpus is built; excluded full names are rejected by the compatibility check. Tests assert both.

## Eligible output count

Counted exactly by `countEligible()` (iterating every given name against every simple and compound surname and applying every template, rule and exclusion). Every eligible name has a distinct display string, which the test suite also checks.

| | Names |
| --- | ---: |
| With a simple surname | 247,200 |
| With a double-barrelled surname | 3,171,453 |
| **Total** | **3,418,653** |

Double-barrels account for most of the space because each of 9,274 compound surnames can follow many given names. The simple-surname space (247,200) is the more representative figure for variety: at the default weights, about 86% of output uses a simple surname (measured over 20,000 names). Both figures are real counts, not raw Cartesian products.

### Expanding the space

The quickest high-quality gains are more given names in the smaller categories and more grounded and flamboyant surnames, since those templates have the narrowest pools. Every 10 extra grounded surnames adds roughly 870 eccentric-grounded names. Avoid spelling variants and suffix permutations: they inflate the count without adding anything a reader would notice.

## Candidate selection

`generator.ts` never materialises the product. Compound surnames come from a virtual pool indexed as `left × right`, built on demand.

1. **Bounded sampling.** Up to 64 random draws, each rejected if it hits an excluded component, a used full name or a rule failure.
2. **Exhaustive fallback.** If all 64 miss, a deterministic scan visits every template, given name and surname once, starting at random offsets so the fallback is not biased towards the start of each list. It is bounded by the size of the eligible space and only runs in genuine scarcity.

All integer choices use rejection sampling (`randomInt`), so there is no modulo bias. Production randomness comes from `crypto.getRandomValues`, buffered. Tests inject a seeded sfc32 generator.

## Repetition rules

`NameSession` (`session-history.ts`) holds the set of emitted full-name IDs, the set of emitted normalised display strings, and the last 20 generations' given-name IDs, surname IDs and surname tokens. It updates all of them in one synchronous step after each pick.

On each generation it tries the full window of 20 first. If no candidate exists, it drops the oldest generation from the exclusions and tries again, down to a window of 1. The previous generation's given name and surname are never relaxed, and full-name uniqueness is never relaxed. If nothing is left at window 1, it returns `exhausted` and the UI offers to start afresh. The result reports the window used, and the UI shows a short note whenever it was relaxed.

Both halves of a double-barrel count towards the surname window, so *Pemberton-Pugh* blocks *Pemberton*, *Fotheringham-Pugh* and so on for the next 20 names.

## Measured performance

- Node 22, Apple M-series: about **4.5 µs per name** over 10,000 consecutive generations, flat as the session grows (the engine tests assert under 2 ms per name after 5,000 names).
- Chromium with the CPU throttled 6× (roughly a mid-range phone): **12.7 ms median, 14.8 ms worst** from pressing Regenerate to the new name in the DOM, over 40 presses. This includes React rendering and one animation frame.
- Counting the full eligible space takes about 3 seconds in Node. It is a test and reporting tool, never run in the browser.
- The page's own JavaScript chunk (engine, corpus and UI components) is 35 kB, 15 kB gzipped. The favourites panel loads separately when opened.

## Distribution checks (from the test suite)

Over 20,000 names from a seeded session:

- Each template's share is within ±40% of its weight share.
- More than 90% of given names appear, and no given name exceeds 1% of output.
- No surname ending (last three letters) exceeds 4% of output.
- All four given-name categories and all nine surname categories appear.

Over five seeds × 5,000 names: no repeated full names, no given name, surname or surname token reused within 20, and every name passes the template, compatibility and exclusion rules.

## Known limitations

- Syllable counts come from a spelling heuristic and are sometimes off by one (for example *Featherstonehaugh* is counted by spelling rather than its "Fanshaw" pronunciation).
- The exclusion list cannot cover every real person. Common pairings of ordinary first names with grounded surnames can coincide with real people who aren't famous; that is unavoidable and harmless.
- Session history lives in `sessionStorage`, so uniqueness is per tab. Opening a second tab starts a fresh history.
- Comedy is subjective. The banks were curated by hand and benefit from more editing passes.
