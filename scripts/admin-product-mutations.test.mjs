import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("product deletes hard-delete rows while preserving order item snapshots", () => {
  const orderItemsSchema = read("src/lib/schema/orderItems.ts");
  const route = read("src/app/api/admin/mutations/route.ts");
  const actions = read("src/app/admin/(protected)/actions.ts");
  const productIdLine = orderItemsSchema
    .split("\n")
    .find((line) => line.includes('productId: integer("product_id")')) ?? "";

  assert.match(productIdLine, /references\(\(\) => productsTable\.id,\s*\{\s*onDelete:\s*"set null"\s*\}\)/);
  assert.doesNotMatch(productIdLine, /\.notNull\(\)/);
  assert.match(route, /orderItemsTable/);
  assert.match(route, /productId:\s*null/);
  assert.match(route, /delete\(productsTable\)/);
  assert.match(actions, /orderItemsTable/);
  assert.match(actions, /productId:\s*null/);
  assert.match(actions, /delete\(productsTable\)/);
});

test("admin product list refreshes after product mutations", () => {
  const list = read("src/app/admin/(protected)/products/ProductsList.tsx");
  const form = read("src/app/admin/(protected)/products/ProductForm.tsx");

  assert.match(list, /useRouter/);
  assert.match(list, /router\.refresh\(\)/);
  assert.match(form, /router\.refresh\(\)/);
});
