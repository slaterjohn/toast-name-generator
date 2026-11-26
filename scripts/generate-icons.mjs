// Renders the favicon, PWA icons and the social sharing image into ./public.
// Run with `node scripts/generate-icons.mjs` after changing the artwork.
// Needs network access once, to load Playfair Display from Google Fonts for
// the rasterised lettering. The committed PNGs are what the site serves.
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const OUT = resolve(process.cwd(), "public");
const FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,500&family=Source+Sans+3:wght@400;600&display=block";

const PALETTE = {
  paper: "#f5eedf",
  card: "#fbf7ee",
  ink: "#1d1714",
  inkSoft: "#4a3f38",
  oxblood: "#6b1424",
  gold: "#a5813f",
  rule: "#cbb991",
};

/** A square "T" monogram. `safe` shrinks the artwork into the maskable safe zone. */
function iconHtml(size, { rounded = true, safe = false } = {}) {
  const radius = rounded ? size * 0.19 : 0;
  const inset = safe ? size * 0.14 : size * 0.08;
  const fontSize = safe ? size * 0.5 : size * 0.66;
  return `<!doctype html><html><head><link rel="stylesheet" href="${FONT_CSS}"><style>
    html,body{margin:0;background:transparent}
    .icon{position:relative;width:${size}px;height:${size}px;border-radius:${radius}px;background:${PALETTE.oxblood};overflow:hidden}
    .rule{position:absolute;inset:${inset}px;border:${Math.max(1, size * 0.03)}px solid ${PALETTE.rule};border-radius:${rounded ? radius * 0.6 : size * 0.04}px}
    .t{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:${fontSize}px;line-height:1;color:${PALETTE.card};padding-bottom:${size * 0.03}px}
  </style></head><body><div class="icon"><div class="rule"></div><div class="t">T</div></div></body></html>`;
}

const ORNAMENT = `<svg viewBox="0 0 200 16" width="260" fill="none" stroke="${PALETTE.gold}"><line x1="4" y1="8" x2="84" y2="8" stroke-width="1"/><line x1="116" y1="8" x2="196" y2="8" stroke-width="1"/><circle cx="90" cy="8" r="1.6" fill="${PALETTE.gold}" stroke="none"/><circle cx="110" cy="8" r="1.6" fill="${PALETTE.gold}" stroke="none"/><path d="M100 1.5 L106.5 8 L100 14.5 L93.5 8 Z" stroke-width="1.2"/><path d="M100 5 L103 8 L100 11 L97 8 Z" fill="${PALETTE.gold}" stroke="none"/></svg>`;

const ogHtml = `<!doctype html><html><head><link rel="stylesheet" href="${FONT_CSS}"><style>
  html,body{margin:0}
  .og{position:relative;width:1200px;height:630px;box-sizing:border-box;background:${PALETTE.paper};background-image:radial-gradient(ellipse at 50% 0%,rgb(255 255 255/.6),transparent 60%),radial-gradient(ellipse at 50% 120%,rgb(107 20 36/.08),transparent 55%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:'Source Sans 3',sans-serif;color:${PALETTE.ink}}
  .frame{position:absolute;inset:28px;border:2px solid ${PALETTE.rule};border-radius:8px}
  .frame2{position:absolute;inset:40px;border:1px solid ${PALETTE.rule};opacity:.7;border-radius:6px}
  .eyebrow{margin-top:28px;font-size:22px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:${PALETTE.inkSoft}}
  h1{margin:18px 0 0;font-family:'Playfair Display',serif;font-weight:700;font-size:84px;line-height:1.05;letter-spacing:-.01em;max-width:1000px}
  .sub{margin-top:22px;font-family:'Playfair Display',serif;font-style:italic;font-weight:500;font-size:34px;color:${PALETTE.inkSoft}}
  .url{position:absolute;bottom:64px;font-size:24px;font-weight:600;letter-spacing:.08em;color:${PALETTE.oxblood}}
</style></head><body><div class="og"><div class="frame"></div><div class="frame2"></div>${ORNAMENT}
  <div class="eyebrow">May we present</div>
  <h1>Toast of London<br>Name Generator</h1>
  <div class="sub">A name of considerable distinction.</div>
  <div class="url">toastnames.com</div></div></body></html>`;

/** Wraps PNG images in an ICO container (PNG-in-ICO is supported everywhere that matters). */
function toIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = 6 + dir.length;
  pngs.forEach(({ size, data }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o);
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...pngs.map((p) => p.data)]);
}

async function render(page, html, width, height, selector) {
  await page.setViewportSize({ width, height });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return page.locator(selector).screenshot({ omitBackground: true });
}

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const page = await browser.newPage({ deviceScaleFactor: 1 });
await mkdir(resolve(OUT, "icons"), { recursive: true });

const files = {
  "icons/icon-192.png": [192, { rounded: true }],
  "icons/icon-512.png": [512, { rounded: true }],
  "icons/maskable-512.png": [512, { rounded: false, safe: true }],
  "icons/maskable-192.png": [192, { rounded: false, safe: true }],
  "apple-touch-icon.png": [180, { rounded: false, safe: false }],
};
for (const [file, [size, opts]] of Object.entries(files)) {
  await writeFile(resolve(OUT, file), await render(page, iconHtml(size, opts), size, size, ".icon"));
}

const icoParts = [];
for (const size of [16, 32, 48]) {
  icoParts.push({ size, data: await render(page, iconHtml(size), size, size, ".icon") });
}
await writeFile(resolve(OUT, "favicon.ico"), toIco(icoParts));

await writeFile(resolve(OUT, "og-image.png"), await render(page, ogHtml, 1200, 630, ".og"));

await browser.close();
console.log("Icons and social image written to ./public");
