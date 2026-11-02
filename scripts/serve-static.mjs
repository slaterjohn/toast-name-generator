// Minimal static server for the exported site (used by Playwright). Usage: node scripts/serve-static.mjs [dir] [port]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "out");
const port = Number(process.argv[3] ?? 4173);
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".woff2": "font/woff2", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".txt": "text/plain",
  ".json": "application/json", ".png": "image/png",
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  let path = normalize(join(root, decodeURIComponent(url.pathname)));
  if (!path.startsWith(root)) return res.writeHead(403).end();
  try {
    if ((await stat(path)).isDirectory()) path = join(path, "index.html");
  } catch {
    path = (await stat(`${path}.html`).catch(() => null)) ? `${path}.html` : join(root, "404.html");
  }
  try {
    const body = await readFile(path);
    res.writeHead(path.endsWith("404.html") ? 404 : 200, { "content-type": types[extname(path)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
