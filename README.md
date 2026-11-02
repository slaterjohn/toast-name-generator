# Toast Name Generator

A small web app that shows one convincingly ridiculous British name at a time, with a button to get another. It is fan-inspired by the naming style of *Toast of London* and *Toast of Tinseltown*, and it only ever produces original names.

> An unofficial fan-inspired name generator. Not affiliated with the creators or broadcasters of Toast of London or Toast of Tinseltown.

Everything runs in the browser. There is no backend, database, account, analytics or AI service, and the page makes no requests to other origins after it loads.

## What it does

- Shows one generated name on load, and a new one each time you press **Regenerate**.
- Never repeats a full name within the tab's session.
- Never reuses a given name or surname from the previous 20 names. If the pool ever runs too thin for that, it relaxes the oldest exclusions first, never the name immediately before, and says so on screen.
- **Copy name** uses the Clipboard API, with a fallback for plain-HTTP hosts and a clear message if copying fails.
- **Favourite** saves the name to this browser's localStorage. The favourites list opens from a small disclosure button and supports copying, removing and clearing (with confirmation).
- Keyboard operable, screen-reader friendly (polite live region for the new name, `aria-pressed` on the favourite toggle) and respects `prefers-reduced-motion`.

## Running it

Requires Node.js 20 or later (developed on 22 LTS).

```bash
npm install
npm run dev          # http://localhost:3000 with hot reload
npm run build        # static export to ./out
npm start            # serve ./out on http://localhost:3000
```

### Checks

```bash
npm run typecheck    # tsc, strict mode
npm run lint         # ESLint (next/core-web-vitals + TypeScript)
npm test             # Vitest: naming engine + React Testing Library
npm run test:e2e     # Playwright against ./out (run npm run build first)
npm run check        # all of the above in order
npm run report       # corpus sizes, exact eligible-name count, sample output, timing
```

To run the browser tests against a deployed copy instead, set `E2E_BASE_URL`, for example `E2E_BASE_URL=http://127.0.0.1:3080 npm run test:e2e`.

## Deploying with Docker

The image is a two-stage build: Node 22 produces the static export, then an unprivileged nginx serves it on port 8080 with a strict Content-Security-Policy, long-lived caching for fingerprinted assets and a `/healthz` endpoint.

```bash
docker compose up -d --build     # http://127.0.0.1:3080
docker compose down
```

The compose file binds to `127.0.0.1` by default. Override with `BIND_ADDRESS` and `PORT`:

```bash
BIND_ADDRESS=0.0.0.0 PORT=8080 docker compose up -d
```

The container runs read-only with `no-new-privileges`.

Because the output is plain static files, `./out` can also be hosted on any static host (GitHub Pages, Netlify, S3, Caddy and so on).

### Testing over Tailscale

Keep the container on loopback and let Tailscale provide HTTPS on the tailnet:

```bash
docker compose up -d --build
tailscale serve --bg --https=10000 http://127.0.0.1:3080
# → https://<machine>.<tailnet>.ts.net:10000 (tailnet only)

tailscale serve --https=10000 off   # to stop
```

HTTPS matters here: browsers only expose the async Clipboard API in a secure context. Over plain HTTP on a tailnet IP, copying still works through the fallback path, but HTTPS is the reliable option.

## Project layout

```
src/
  app/                   layout, page, global styles (Next.js App Router)
  components/            name display, buttons, favourites panel, shadcn/ui primitives
  hooks/                 use-name-session (generation), use-favourites
  lib/
    names/               the naming engine: pure TypeScript, no React or DOM
      corpus-data.ts     curated word banks
      corpus.ts          builds typed entries with metadata
      exclusions.ts      known names and components that must never appear
      templates.ts       weighted comic patterns
      compatibility.ts   quality rules for pairs and double-barrels
      random.ts          crypto RNG, seeded RNG, unbiased integer selection
      generator.ts       candidate selection (bounded sampling + exhaustive fallback)
      session-history.ts no-repeat rules, relaxation, persistence snapshot
      count.ts           exact eligible-name counter
    storage/             favourites (localStorage), session snapshot (sessionStorage)
tests/
  names/                 engine tests (Vitest)
  components/            UI tests (Vitest + React Testing Library, jsdom)
  e2e/                   browser tests (Playwright, includes an axe WCAG 2.2 AA scan)
docs/
  NAMING-ENGINE.md       design, corpus sizes, measured counts, quality checks
  PHASE-2.md             personalised-name design contract (not implemented)
```

## Storage and privacy

| What | Where | Lifetime |
| --- | --- | --- |
| Generation history (IDs of names already shown, last 20 components) | `sessionStorage` | Until the tab closes. Capped at the latest 10,000 names. |
| Favourites (name ID and display text) | `localStorage` | Until cleared in the app or by the browser. Capped at 200. |

Nothing else is stored, and nothing is sent anywhere. If storage is unavailable (private browsing, blocked cookies), the app still works but forgets history on reload.

Uniqueness is guaranteed within a tab's session only. It is not guaranteed across tabs, devices or browsers, because there is no server-side history.

## Fonts and licences

Playfair Display and Source Sans 3, both under the SIL Open Font License, are downloaded at build time by `next/font` and served from the same origin.

## Status

The MVP is complete. Phase 2 (personalised names from a "Your name" field, shareable results, downloadable cards) is designed in [docs/PHASE-2.md](docs/PHASE-2.md) but not built.
