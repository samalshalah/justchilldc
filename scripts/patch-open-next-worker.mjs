import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const serverBundlePaths = [
  resolve(root, ".open-next/server-functions/default/handler.mjs"),
  resolve(root, ".open-next/server-functions/default/index.mjs"),
];

const manifestMarker = /function evalManifest\(([$\w]+),[^)]*\)\{/;
const shimCheck = "/* open-next-middleware-manifest */";
const requireMarker =
  "function(x){if(typeof require<\"u\")return require.apply(this,arguments);throw Error('Dynamic require of \"'+x+'\" is not supported')}";
const requireShim =
  "function(x){if(String(x).endsWith(\"/.next/server/middleware-manifest.json\")||String(x).endsWith(\".next/server/middleware-manifest.json\"))return {version:3,middleware:{},functions:{},sortedMiddleware:[]};if(typeof require<\"u\")return require.apply(this,arguments);throw Error('Dynamic require of \"'+x+'\" is not supported')}";
const prettyRequireMarker = `function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
}`;
const prettyRequireShim = `function(x) {
  if (String(x).endsWith("/.next/server/middleware-manifest.json") || String(x).endsWith(".next/server/middleware-manifest.json")) return { version: 3, middleware: {}, functions: {}, sortedMiddleware: [] };
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
}`;
const requireShimCheck = "String(x).endsWith(\"/.next/server/middleware-manifest.json\")";

let patchedFiles = 0;

for (const filePath of serverBundlePaths) {
  let source = readFileSync(filePath, "utf8");
  let patched = false;

  if (!source.includes(requireShimCheck)) {
    if (source.includes(requireMarker)) {
      source = source.replace(requireMarker, requireShim);
      patched = true;
    } else if (source.includes(prettyRequireMarker)) {
      source = source.replace(prettyRequireMarker, prettyRequireShim);
      patched = true;
    } else if (source.includes("Dynamic require of")) {
      throw new Error(`Could not find OpenNext __require marker to patch in ${filePath}.`);
    }
  }

  if (source.includes("function evalManifest") && !source.includes(shimCheck)) {
    if (!manifestMarker.test(source)) {
      throw new Error(`Could not find OpenNext evalManifest marker to patch in ${filePath}.`);
    }
    source = source.replace(manifestMarker, (signature, parameter) =>
      `${signature}${shimCheck}${parameter}=${parameter}.replaceAll("\\\\","/");if(${parameter}.endsWith("server/middleware-manifest.json"))return {version:3,middleware:{},functions:{},sortedMiddleware:[]};`
    );
    patched = true;
  }

  if (patched) {
    writeFileSync(filePath, source);
    patchedFiles++;
  }
}

console.log(
  patchedFiles > 0
    ? `Patched OpenNext middleware manifest shim in ${patchedFiles} file(s).`
    : "OpenNext server bundles already include middleware manifest shim."
);
