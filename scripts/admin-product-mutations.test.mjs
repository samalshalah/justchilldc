import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("product deletes archive rows instead of physically deleting order-linked products", () => {
  const schema = read("src/lib/schema/products.ts");
  const route = read("src/app/api/admin/mutations/route.ts");
  const actions = read("src/app/admin/(protected)/actions.ts");
  const data = read("src/lib/data.ts");

  assert.match(schema, /archivedAt:\s*timestamp\("archived_at"/);
  assert.doesNotMatch(route, /db\.delete\(productsTable\)\.where\(eq\(productsTable\.id,\s*id\)\)/);
  assert.doesNotMatch(actions, /db\.delete\(productsTable\)\.where\(eq\(productsTable\.id,\s*id\)\)/);
  assert.match(route, /archivedAt:\s*new Date\(\)/);
  assert.match(actions, /archivedAt:\s*new Date\(\)/);
  assert.match(data, /isNull\(productsTable\.archivedAt\)/);
});

test("admin product list refreshes after product mutations", () => {
  const list = read("src/app/admin/(protected)/products/ProductsList.tsx");
  const form = read("src/app/admin/(protected)/products/ProductForm.tsx");

  assert.match(list, /useRouter/);
  assert.match(list, /router\.refresh\(\)/);
  assert.match(form, /router\.refresh\(\)/);
});
