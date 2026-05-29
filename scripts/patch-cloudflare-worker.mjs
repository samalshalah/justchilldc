import { existsSync, readFileSync, writeFileSync } from "node:fs";

const target = process.argv[2] ?? "wrangler-dryrun/worker.js";

if (!existsSync(target)) {
  console.error(`Worker bundle was not found: ${target}`);
  process.exit(1);
}

const needle = `function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});`;

const replacement = `function(x) {
  if (String(x).includes("middleware-manifest.json")) return { version: 3, middleware: {}, functions: {}, sortedMiddleware: [] };
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});`;

const source = readFileSync(target, "utf8");

if (source.includes(replacement)) {
  console.log(`Worker bundle is already patched: ${target}`);
  process.exit(0);
}

if (!source.includes(needle)) {
  console.error("Could not find the expected dynamic require wrapper in the Worker bundle.");
  process.exit(1);
}

writeFileSync(target, source.replace(needle, replacement));
console.log(`Patched Worker bundle: ${target}`);
