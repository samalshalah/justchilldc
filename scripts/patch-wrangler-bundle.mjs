import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = resolve(root, "wrangler-dryrun/worker.js");

const prettyRequireMarker = `function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
}`;
const prettyRequireShim = `function(x) {
  if (String(x).endsWith("/.next/server/middleware-manifest.json") || String(x).endsWith(".next/server/middleware-manifest.json")) return { version: 3, middleware: {}, functions: {}, sortedMiddleware: [] };
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
}`;

let source = readFileSync(bundlePath, "utf8");

if (!source.includes(prettyRequireMarker)) {
  console.log("Wrangler bundle dynamic require shims already patched.");
  process.exit(0);
}

let patchedCount = 0;
while (source.includes(prettyRequireMarker)) {
  source = source.replace(prettyRequireMarker, prettyRequireShim);
  patchedCount++;
}
writeFileSync(bundlePath, source);
console.log(`Patched ${patchedCount} Wrangler bundle dynamic require shim(s).`);
