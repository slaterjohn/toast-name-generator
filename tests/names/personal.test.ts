import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import vectors from "./personal-vectors.v1.json";
import { buildCorpus, createEngine, getDefaultCorpus } from "@/lib/names";
import { canonicaliseName, checkNameInput } from "@/lib/names/canonicalise";
import {
  getMappingVersion,
  mappingFingerprint,
  personalDigest,
  personalisedName,
} from "@/lib/names/deterministic";
import { isExcludedFullName } from "@/lib/names/exclusions";
import { decodeShareCode, shareCode, shareUrl } from "@/lib/names/share";
import { sha256Utf8, toHex, utf8Encode } from "@/lib/names/sha256";
import { TEMPLATES } from "@/lib/names/templates";

const engine = getMappingVersion(1).engine();

describe("sha256", () => {
  it("matches published test vectors", () => {
    expect(toHex(sha256Utf8(""))).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(toHex(sha256Utf8("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(toHex(sha256Utf8("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"))).toBe(
      "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
    );
  });

  it("encodes UTF-8 exactly like TextEncoder, including lone surrogates", () => {
    const enc = new TextEncoder();
    for (const s of ["", "abc", "é", "€", "张伟", "😀", "a\uD800b", "\uDC00", "\uD83D", "𝔘𝔫𝔦"]) {
      expect(Array.from(utf8Encode(s))).toEqual(Array.from(enc.encode(s)));
    }
  });

  it("matches Node's crypto for many lengths and scripts", () => {
    const samples = ["a", "Zoë", "张伟", "😀 emoji", "x".repeat(55), "y".repeat(56), "z".repeat(64), "q".repeat(1000)];
    for (let i = 0; i < 200; i++) samples.push(String.fromCodePoint(...Array.from({ length: i }, (_, j) => 32 + ((i * 7 + j * 13) % 900))));
    for (const s of samples) {
      expect(toHex(sha256Utf8(s))).toBe(createHash("sha256").update(s, "utf8").digest("hex"));
    }
  });
});

describe("canonicalisation v1", () => {
  const same = (a: string, b: string) => expect(canonicaliseName(a)).toBe(canonicaliseName(b));

  it("trims and collapses whitespace, including tabs and non-breaking spaces", () => {
    same("  John   Slater ", "John Slater");
    same("John\tSlater\n", "john slater");
    same("John Slater", "John Slater");
    same("John　Slater", "John Slater");
  });

  it("is case-insensitive without locale rules", () => {
    same("MCDONALD", "mcdonald");
    same("İSMAIL", "ismail");
    same("ΟΔΥΣΣΕΥΣ", "οδυσσευς");
    same("Οδυσσεύς", "οδυσσεύσ");
  });

  it("unifies Unicode encodings but keeps diacritics", () => {
    same("José", "José");
    same("ﬁona", "fiona"); // ligature, via NFKC
    expect(canonicaliseName("José")).not.toBe(canonicaliseName("Jose"));
  });

  it("unifies apostrophes and dashes", () => {
    same("O’Neill", "O'Neill");
    same("Oʼ Neill", "O' Neill");
    same("Jean–Luc", "Jean-Luc");
    same("Jean‐Luc", "Jean-Luc");
  });

  it("validates input", () => {
    expect(checkNameInput("   ")).toBe("empty");
    expect(checkNameInput("!!! ---")).toBe("no-letters");
    expect(checkNameInput("a".repeat(201))).toBe("too-long");
    expect(checkNameInput("a".repeat(200))).toBeNull();
    expect(checkNameInput("张伟")).toBeNull();
  });
});

describe("personalised names", () => {
  it("is frozen: v1 inputs still produce the recorded names", () => {
    for (const [input, expected] of vectors as [string, string][]) {
      expect(personalisedName(input)?.display, input).toBe(expected);
    }
  });

  it("pins the v1 corpus, templates, rules and exclusions", () => {
    // If this fails, the live word banks or rules changed. Do not update the
    // fingerprint for v1: freeze the old data as v1 and add a v2 mapping
    // (see docs/PHASE-2.md, "Versioning").
    expect(mappingFingerprint(engine)).toBe(getMappingVersion(1).fingerprint);
  });

  it("maps equivalent inputs to the same name", () => {
    const groups = [
      ["John Slater", "  john   SLATER  ", "JOHN\tslater"],
      ["Siobhán O'Neill", "SIOBHÁN O’NEILL", "Siobhán O'Neill"],
      ["Jean-Luc", "jean–luc", "JEAN‐LUC"],
      ["İsmail", "ismail", "ISMAİL"],
    ];
    for (const group of groups) {
      const names = group.map((g) => personalisedName(g)?.display);
      expect(new Set(names).size, group.join(" / ")).toBe(1);
    }
  });

  it("is consistent across repeated calls", () => {
    for (let i = 0; i < 50; i++) expect(personalisedName("Repeat Me")?.id).toBe(personalisedName("Repeat Me")?.id);
  });

  it("returns null for empty input", () => {
    expect(personalisedName("")).toBeNull();
    expect(personalisedName("   ")).toBeNull();
  });

  it("only produces eligible, non-excluded names, spread across templates and categories", () => {
    const templates = new Map<string, number>();
    const surnameCats = new Set<string>();
    const givenCats = new Set<string>();
    const N = 3000;
    let compound = 0;
    for (let i = 0; i < N; i++) {
      const n = personalisedName(`Test Person ${i}`)!;
      expect(engine.isEligible(n.given, n.surname)).toBe(true);
      expect(isExcludedFullName(n.norm)).toBe(false);
      templates.set(n.templateId, (templates.get(n.templateId) ?? 0) + 1);
      surnameCats.add(n.surname.category);
      givenCats.add(n.given.category);
      if (n.surname.category === "compound") compound++;
    }
    const totalWeight = TEMPLATES.reduce((a, t) => a + t.weight, 0);
    for (const t of TEMPLATES) {
      const share = (templates.get(t.id) ?? 0) / N;
      expect(share, t.id).toBeGreaterThan((t.weight / totalWeight) * 0.6);
      expect(share, t.id).toBeLessThan((t.weight / totalWeight) * 1.4);
    }
    expect(givenCats.size).toBe(4);
    expect(surnameCats.size).toBe(9);
    // Double-barrels stay a minority, as in random mode.
    expect(compound / N).toBeLessThan(0.2);
  });

  it("uses a domain-separated, versioned digest", () => {
    expect(toHex(personalDigest("john slater", 1))).toBe(
      createHash("sha256").update("toast-name-generator/personal/v1\u0000john slater", "utf8").digest("hex"),
    );
    expect(toHex(personalDigest("john slater", 1))).not.toBe(toHex(personalDigest("john slater", 2)));
  });

  it("keeps v1 results when a different corpus exists for a later version", () => {
    // Simulate a future corpus edit: a v2 engine built from altered banks
    // must not change what the v1 mapping returns.
    const live = getDefaultCorpus();
    const altered = createEngine(
      buildCorpus(
        {
          given: { ordinary: ["Gary", "Sharon"], eccentric: ["Torquil"] },
          surnames: { household: ["Kettle", "Ladle"], grounded: ["Ackroyd"] },
          barrelLeft: [],
          barrelRight: [],
        },
        2,
      ),
    );
    const before = (vectors as [string, string][]).map(([input]) => personalisedName(input, 1)?.display);
    // The altered engine produces different output when used directly...
    const differs = (vectors as [string, string][]).some(
      ([input]) => personalisedName(input, 1, altered)?.display !== personalisedName(input, 1)?.display,
    );
    expect(differs).toBe(true);
    // ...but the registered v1 mapping is untouched.
    const after = (vectors as [string, string][]).map(([input]) => personalisedName(input, 1)?.display);
    expect(after).toEqual(before);
    expect(live.version).toBe(1);
  });

  it("rejects unknown mapping versions", () => {
    expect(() => personalisedName("x", 99)).toThrow(RangeError);
  });
});

describe("share codes", () => {
  const corpusEngine = createEngine(getDefaultCorpus());

  it("round-trips simple and double-barrelled names", () => {
    for (let i = 0; i < 500; i++) {
      const n = personalisedName(`Share ${i}`)!;
      const code = shareCode(n);
      expect(code).toMatch(/^[a-z]+\.[a-z]+(-[a-z]+)?$/);
      expect(decodeShareCode(corpusEngine, code)?.id).toBe(n.id);
    }
  });

  it("never contains the entered name", () => {
    const input = "Wilhelmina Fanshawe-Testcase";
    const n = personalisedName(input)!;
    const url = shareUrl(n, "https://example.test/app/?n=old#x");
    expect(url).not.toMatch(/wilhelmina%20|testcase/i);
    expect(url).toBe(`https://example.test/app/?n=${shareCode(n)}`);
  });

  it("rejects malformed, unknown or ineligible codes", () => {
    for (const bad of [null, "", "cyril", "cyril.", ".kettle", "Cyril.Kettle", "cyril.kettle.x", "nobody.kettle", "cyril.nothing", "<script>.x", "a".repeat(100)]) {
      expect(decodeShareCode(corpusEngine, bad)).toBeNull();
    }
  });
});
