// Runs the frozen personalised-name vectors in JavaScriptCore (Safari's
// engine) via the jsc shell that ships with macOS. Usage: npm run test:jsc
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const JSC = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc";
if (!existsSync(JSC)) {
  console.log("jsc not found (macOS only); skipping.");
  process.exit(0);
}
const dir = mkdtempSync(join(tmpdir(), "toast-jsc-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  `import { personalisedName } from ${JSON.stringify(join(process.cwd(), "src/lib/names/deterministic.ts"))};
import vectors from ${JSON.stringify(join(process.cwd(), "tests/names/personal-vectors.v1.json"))};
let bad = 0;
for (const [input, expected] of vectors) {
  const got = personalisedName(input)?.display;
  if (got !== expected) { bad++; print("MISMATCH " + JSON.stringify(input) + " expected " + expected + " got " + got); }
}
print(bad === 0 ? "OK " + vectors.length + " vectors" : "FAILED " + bad);`,
);
const out = join(dir, "bundle.js");
await build({ entryPoints: [entry], bundle: true, outfile: out, format: "iife", target: "es2020", logLevel: "error" });
const result = execFileSync(JSC, [out], { encoding: "utf8" });
process.stdout.write(result);
if (!result.includes("OK ")) process.exit(1);
