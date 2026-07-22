import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const cache = new Map();

function loadTs(path) {
  if (cache.has(path)) return cache.get(path);
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const mod = { exports: {} };
  cache.set(path, mod.exports);
  const req = (id) => {
    if (id === "./potency") return loadTs("src/lib/potency.ts");
    if (id === "./product-size") return loadTs("src/lib/product-size.ts");
    if (id === "./seo-generator") {
      return { normalizeImportedProductName: (value) => value.trim() };
    }
    return require(id);
  };
  Function("module", "exports", "require", js)(mod, mod.exports, req);
  cache.set(path, mod.exports);
  return mod.exports;
}

const { parseInventoryCsv } = loadTs("src/lib/import-csv-client.ts");

test("duplicate SKU import keeps one THC value instead of publishing a range", () => {
  const csv = [
    '"SKU","Product","Category","Strain","Vendor","Available","Current price","Calculated THC (mg)"',
    '="15617291",="DC | GELATO CAKE | 3.5G",="Flower",="Gelato Cake",="District Cannabis",="1",="45",="737.2"',
    '="15617291",="DC | GELATO CAKE | 3.5G",="Flower",="Gelato Cake",="District Cannabis",="12",="45",="700.1"',
  ].join("\n");

  const { rows, errors } = parseInventoryCsv(csv);

  assert.equal(errors.length, 0);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].quantity, 13);
  assert.equal(rows[0].thc, "21.1%");
  assert.equal(rows[0].weight, "3.5g");
  assert.match(rows[0].warnings.join(" "), /different thc/);
  assert.doesNotMatch(rows[0].thc, /-/);
});

test("edible import extracts dose size from the product title", () => {
  const csv = [
    '"SKU","Product","Category","Strain","Vendor","Available","Current price","Calculated THC (mg)"',
    '="67408480",="EasyDay | Tangerine Ginger | 10mg  1:1 THC:CBD",="Edibles",="No Strain",="Easy Day",="11",="40",="10"',
  ].join("\n");

  const { rows, errors } = parseInventoryCsv(csv);

  assert.equal(errors.length, 0);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].thc, "10mg");
  assert.equal(rows[0].weight, "10mg THC");
});
