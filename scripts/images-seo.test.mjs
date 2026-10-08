import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";

async function importImagesModule() {
  const sourcePath = path.resolve("src/lib/images.ts");
  const source = await readFile(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
  });
  const dir = await mkdtemp(path.join(tmpdir(), "images-seo-"));
  const compiledPath = path.join(dir, "images.mjs");
  await writeFile(compiledPath, compiled.outputText, "utf8");
  return import(pathToFileURL(compiledPath).href);
}

const mod = await importImagesModule();

test("product image URLs include an SEO product filename alias", () => {
  const url = mod.productImageUrl({
    id: 207,
    name: "Fuel Biscuits | 3.5g",
    category: "Flower",
    brandName: "AltSol",
    imageUrl: "/objects/uploads/550e8400-e29b-41d4-a716-446655440000",
  });

  assert.equal(
    url,
    "/api/storage/objects/uploads/550e8400-e29b-41d4-a716-446655440000/fuel-biscuits-3-5g-flower-altsol-207.jpg"
  );
});

test("product image URLs leave already named upload paths unchanged", () => {
  const url = mod.productImageUrl({
    id: 207,
    name: "Fuel Biscuits | 3.5g",
    imageUrl: "/objects/uploads/products/fuel-biscuits-3-5g-207-a1b2c3d4.jpg",
  });

  assert.equal(
    url,
    "/api/storage/objects/uploads/products/fuel-biscuits-3-5g-207-a1b2c3d4.jpg"
  );
});

test("product image alt text includes product, brand, category, and store", () => {
  const alt = mod.productImageAlt(
    {
      name: "Fuel Biscuits | 3.5g",
      category: "Flower",
      brandName: "AltSol",
    },
    "Just Chill DC"
  );

  assert.equal(alt, "Fuel Biscuits | 3.5g - AltSol Flower at Just Chill DC");
});
