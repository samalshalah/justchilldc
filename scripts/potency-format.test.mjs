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

test("converts calculated THC mg to percent for weighted inhalable products", () => {
  assert.equal(
    formatImportedThc({
      category: "Concentrates",
      productName: "District cannabis | 1g Dompen | Blue Dream",
      thcRaw: "755",
      calculatedThcRaw: "755",
    }),
    "75.5%"
  );

  assert.equal(
    formatImportedThc({
      category: "Concentrates",
      productName: "ATOMIC POP | .5g DISPOSABLE",
      thcRaw: "391.3",
      calculatedThcRaw: "391.3",
    }),
    "78.3%"
  );

  assert.equal(
    formatImportedThc({
      category: "Flower",
      productName: "Alt Sol | 3.5g | Zack's Cake",
      thcRaw: "764.3",
      calculatedThcRaw: "764.3",
    }),
    "21.8%"
  );
});

test("infers common pre-roll pack weights before converting to percent", () => {
  assert.equal(
    formatImportedThc({
      category: "Pre-Rolls",
      productName: "ANIMAL COOKIES | 3PK PREROLLS",
      thcRaw: "457.1",
      calculatedThcRaw: "457.1",
    }),
    "21.8%"
  );

  assert.equal(
    formatImportedThc({
      category: "Pre-Rolls",
      productName: "BLUE SHARPIEZ | 5PK PREROLL",
      thcRaw: "342.2",
      calculatedThcRaw: "342.2",
    }),
    "13.7%"
  );
});

test("keeps edibles and capsules as mg values", () => {
  assert.equal(
    formatImportedThc({
      category: "Capsules",
      productName: "District Cannabis | Capsules 10mg THC 10ct.",
      thcRaw: "1",
      calculatedThcRaw: "1",
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
