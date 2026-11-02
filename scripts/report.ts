/* Prints corpus sizes, the exact eligible-name count, a sample and timing. Run: npm run report */
import { countEligible } from "../src/lib/names/count";
import { createEngine, getDefaultCorpus, createSeededRandom, NameSession } from "../src/lib/names";

const engine = createEngine(getDefaultCorpus());
const t0 = performance.now();
const count = countEligible(engine, { checkDisplay: true });
const t1 = performance.now();
console.log(JSON.stringify(count, null, 2));
console.log(`count took ${(t1 - t0).toFixed(0)} ms`);

const seed = Number(process.argv[2] ?? 1);
const session = new NameSession(engine, createSeededRandom(seed));
const N = 10_000;
const samples: string[] = [];
const s0 = performance.now();
const templates: Record<string, number> = {};
for (let i = 0; i < N; i++) {
  const r = session.generate();
  if (r.status !== "ok") throw new Error("exhausted");
  templates[r.name.templateId] = (templates[r.name.templateId] ?? 0) + 1;
  if (i < 40) samples.push(r.name.display);
}
const s1 = performance.now();
console.log(samples.join("\n"));
console.log(`generation: ${((s1 - s0) / N * 1000).toFixed(1)} µs per name over ${N}`);
console.log(templates);
