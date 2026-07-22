import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/potency.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const module = { exports: {} };
Function("module", "exports", js)(module, module.exports);
const { formatImportedThc } = module.exports;

test("ignores calculated THC mg when no explicit THC value is present", () => {
  assert.equal(
    formatImportedThc({
      category: "Concentrates",
      productName: "District cannabis | 1g Dompen | Blue Dream",
      calculatedThcRaw: "755",
    }),
    ""
  );

  assert.equal(
    formatImportedThc({
      category: "Flower",
      productName: "Alt Sol | 3.5g | Zack's Cake",
      calculatedThcRaw: "764.3",
    }),
    ""
  );
});

test("formats explicit THC percentages and mg values from a THC column", () => {
  assert.equal(
    formatImportedThc({
      category: "Flower",
      productName: "Alt Sol | 3.5g | Zack's Cake",
      thcRaw: "21.8%",
    }),
    "21.8%"
  );

  assert.equal(
    formatImportedThc({
      category: "Pre-Rolls",
      productName: "ANIMAL COOKIES | 3PK PREROLLS",
      thcRaw: "22",
    }),
    "22%"
  );

  assert.equal(
    formatImportedThc({
      category: "Edibles",
      productName: "Infused Honey",
      thcRaw: "200mg",
    }),
    "200mg"
  );
});

test("unitless explicit edible and capsule THC values are treated as mg", () => {
  assert.equal(
    formatImportedThc({
      category: "Capsules",
      productName: "District Cannabis | Capsules 10mg THC 10ct.",
      thcRaw: "10",
    }),
    "10mg"
  );

  assert.equal(
    formatImportedThc({
      category: "Edibles",
      productName: "Infused Honey",
      thcRaw: "200",
      calculatedThcRaw: "200",
    }),
    "200mg"
  );
});
