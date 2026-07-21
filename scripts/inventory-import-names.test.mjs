import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("inventory import preserves client product names instead of applying SEO cleanup", () => {
  const clientParser = read("src/lib/import-csv-client.ts");
  const serverParser = read("src/lib/import-csv.ts");
  const importActions = read("src/app/admin/(protected)/products/import-actions.ts");
  const mutationRoute = read("src/app/api/admin/mutations/route.ts");
  const previewData = read("src/lib/preview-data.ts");

  for (const source of [clientParser, serverParser]) {
    assert.doesNotMatch(source, /seoTitleCase\(cleanProductName\(get\("name"\)\)\)/);
    assert.match(source, /const name = normalizeImportedProductName\(get\("name"\)\);/);
  }

  for (const source of [importActions, mutationRoute, previewData]) {
    assert.doesNotMatch(source, /seoTitleCase\(cleanProductName\(row\.name\)\)/);
    assert.match(source, /normalizeImportedProductName\(row\.name\)/);
  }
});

test("inventory import preserves product photos when updating existing products", () => {
  const importActions = read("src/app/admin/(protected)/products/import-actions.ts");
  const mutationRoute = read("src/app/api/admin/mutations/route.ts");
  const previewData = read("src/lib/preview-data.ts");

  for (const source of [importActions, mutationRoute]) {
    const baseValues = source.match(/const baseValues = \{[\s\S]*?\n\s*\};/);
    assert.ok(baseValues);
    assert.doesNotMatch(baseValues[0], /imageUrl:\s*null/);
  }

  const productValues = previewData.match(/const productValues = \{[\s\S]*?\n\s*\};/);
  assert.ok(productValues);
  assert.doesNotMatch(productValues[0], /imageUrl:\s*null/);
  assert.match(previewData, /s\.products\[existingIdx\] = \{ \.\.\.s\.products\[existingIdx\], \.\.\.productValues \};/);
});
