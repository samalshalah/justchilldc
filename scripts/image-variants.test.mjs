import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";

const dir = await mkdtemp(path.join(tmpdir(), "image-variants-"));
async function compile(file, name, transform = (value) => value) {
  const source = transform(await readFile(file, "utf8"));
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  });
  const target = path.join(dir, `${name}.mjs`);
  await writeFile(target, compiled.outputText);
  return import(pathToFileURL(target).href);
}
const variants = await compile("src/lib/image-variants.ts", "image-variants");
const storage = await compile("src/lib/storage.ts", "storage", (source) => source
  .replace('import "server-only";', "")
  .replace('import { getCloudflareContext } from "@opennextjs/cloudflare";', "const getCloudflareContext = () => ({ env: globalThis.imageTestEnv });")
  .replace('import { isLocalPreviewMode } from "@/lib/preview";', "const isLocalPreviewMode = () => false;")
  .replace('from "@/lib/image-variants"', 'from "./image-variants.mjs"'));
const upload = await compile("src/lib/optimize-upload.ts", "optimize-upload", (source) => source
  .replace('from "./image-variants"', 'from "./image-variants.mjs"')
  .replace('await import("heic-to/csp")', '{ heicTo: globalThis.heicTestConverter }'));
const flow = await compile("src/lib/upload-image.ts", "upload-image", (source) => source
  .replace('from "./optimize-upload"', 'from "./optimize-upload.mjs"'));

function mockImage(width = 1000, height = 1500) {
  globalThis.Image = class {
    naturalWidth = width;
    naturalHeight = height;
    set src(value) { queueMicrotask(() => this.onload()); }
  };
}

test("variant URLs preserve descriptive paths and existing query parameters", () => {
  assert.equal(variants.imageVariantUrl("/api/storage/objects/uploads/fuel-biscuits.jpg?version=2", 320),
    "/api/storage/objects/uploads/fuel-biscuits.jpg?version=2&width=320");
  assert.match(variants.imageVariantSrcSet("/api/storage/objects/uploads/photo.jpg"), /width=1280 1280w$/);
  assert.equal(variants.imageVariantSrcSet("/images/placeholder.svg"), undefined);
  assert.equal(variants.parseImageVariantWidth("640"), 640);
  for (const value of ["1", "0", "640.0", "640px", "99999", "", null]) {
    assert.equal(variants.parseImageVariantWidth(value), null);
  }
});

test("legacy aliases resolve optimized copies before their original", async () => {
  const seen = [];
  const object = { body: new Response("webp").body, size: 4, httpMetadata: { contentType: "image/webp" } };
  globalThis.imageTestEnv = { MEDIA_BUCKET: { get: async (key) => {
    seen.push(key);
    return key === "objects/uploads/legacy-id.variants/320.webp" ? object : null;
  } } };
  const result = await storage.getEntityObject("/objects/uploads/legacy-id/product-name.jpg", 320);
  assert.equal(result.object, object);
  assert.equal(result.variantWidth, 320);
  assert.ok(seen.every((key) => key.endsWith(".webp")));
});

test("missing variants fall back to the original photo", async () => {
  const object = { body: new Response("jpeg").body, size: 4 };
  globalThis.imageTestEnv = { MEDIA_BUCKET: { get: async (key) => key === "objects/uploads/products/photo.jpg" ? object : null } };
  const result = await storage.getEntityObject("/objects/uploads/products/photo.jpg", 640);
  assert.equal(result.object, object);
  assert.equal(result.variantWidth, null);
});

test("variant writes never replace the original key", async () => {
  const keys = [];
  globalThis.imageTestEnv = { MEDIA_BUCKET: { put: async (key) => keys.push(key) } };
  await storage.putUploadedObject({ objectPath: "/objects/uploads/photo.jpg", body: new ArrayBuffer(1), contentType: "image/jpeg" });
  await storage.putUploadedObject({ objectPath: "/objects/uploads/photo.jpg", body: new ArrayBuffer(1), contentType: "image/webp", width: 320 });
  assert.deepEqual(keys, ["objects/uploads/photo.jpg", "objects/uploads/photo.jpg.variants/320.webp"]);
  await assert.rejects(storage.putUploadedObject({ objectPath: "/objects/uploads/photo.jpg", body: new ArrayBuffer(1), contentType: "image/png", width: 640 }), /WebP/);
});

test("browser upload generates three WebP sizes without enlarging small photos", async () => {
  const sizes = [];
  let closed = false;
  mockImage();
  globalThis.createImageBitmap = async (_file, options) => ({ width: options.resizeWidth, height: options.resizeHeight, close() { closed = true; } });
  globalThis.document = { createElement: () => ({ width: 0, height: 0,
    getContext: () => ({ drawImage() {} }),
    toBlob(callback, type) { sizes.push([this.width, this.height]); callback(new Blob(["webp"], { type })); },
  }) };
  const result = await upload.createUploadVariants(new File(["jpeg"], "photo.jpg", { type: "image/jpeg" }));
  assert.deepEqual(sizes, [[320, 480], [640, 960], [853, 1280]]);
  assert.deepEqual(result.map((item) => item.width), [320, 640, 1280]);
  assert.ok(result.every((item) => item.blob.type === "image/webp"));
  assert.equal(closed, true);
  assert.deepEqual(await upload.createUploadVariants(new File(["gif"], "animated.gif", { type: "image/gif" })), []);
});

test("product saves wait until image uploads finish on desktop and mobile", async () => {
  const form = await readFile("src/app/admin/(protected)/products/ProductForm.tsx", "utf8");
  assert.match(form, /if \(imageUploading\) return;/);
  assert.match(form, /onUploadingChange=\{setImageUploading\}/);
  assert.equal([...form.matchAll(/disabled=\{pending \|\| imageUploading\}/g)].length, 2);
  const uploader = await readFile("src/components/AdminImageUploader.tsx", "utf8");
  assert.match(uploader, /onUploadingChange\?\.\(true\)/);
  assert.match(uploader, /finally \{[\s\S]*notify.current\?\.\(false\)/);
  assert.match(uploader, /e.currentTarget.value = ""/);
  assert.match(uploader, /Retry upload/);
});

test("HEIC conversion normalizes the filename and MIME before upload", async () => {
  globalThis.heicTestConverter = async () => new Blob(["converted"], { type: "image/jpeg" });
  const prepared = await upload.prepareUploadFile(new File(["heic"], "phone.HEIC", { type: "image/heic" }));
  assert.equal(prepared.name, "phone.jpg");
  assert.equal(prepared.type, "image/jpeg");
  assert.equal((await upload.prepareUploadFile(new File(["jpeg"], "photo.jpg"))).type, "image/jpeg");
});

test("48 megapixel photos are resized before thumbnail canvas allocation", async () => {
  mockImage(8000, 6000);
  let decoded;
  globalThis.createImageBitmap = async (_file, options) => {
    decoded = options;
    return { width: options.resizeWidth, height: options.resizeHeight, close() {} };
  };
  await upload.createUploadVariants(new File(["jpeg"], "large.jpg", { type: "image/jpeg" }));
  assert.equal(decoded.resizeWidth, 1280);
  assert.equal(decoded.resizeHeight, 960);
});

test("HTML image fallback works when createImageBitmap is unavailable", async () => {
  mockImage(600, 400);
  globalThis.createImageBitmap = undefined;
  const result = await upload.createUploadVariants(new File(["jpeg"], "photo.jpg", { type: "image/jpeg" }));
  assert.equal(result.length, 3);
});

test("failed thumbnail delivery preserves the successfully uploaded photo", async () => {
  mockImage();
  let selected;
  let failures = 0;
  globalThis.fetch = async (url, init) => {
    if (init.method === "POST") return Response.json({ uploadUrl: "/api/admin/upload-url?objectPath=photo.jpg", objectPath: "/objects/uploads/photo.jpg" });
    if (url.includes("width=640")) { failures++; throw new TypeError("Failed to fetch"); }
    return new Response(null, { status: 200 });
  };
  const result = await flow.uploadAdminImage(new File(["jpeg"], "photo.jpg", { type: "image/jpeg" }), {
    folder: "products", onUploaded: (value) => { selected = value; },
  });
  assert.equal(selected, "/objects/uploads/photo.jpg");
  assert.match(result.warning, /Photo uploaded/);
  assert.equal(failures, 3);
});

test("primary failures are retried, while expired sessions fail immediately", async () => {
  let attempts = 0;
  globalThis.fetch = async () => { attempts++; return new Response(null, { status: attempts < 3 ? 503 : 200 }); };
  assert.equal((await flow.uploadWithRetry("/upload", { method: "PUT" })).status, 200);
  assert.equal(attempts, 3);
  attempts = 0;
  globalThis.fetch = async () => { attempts++; return new Response(null, { status: 401 }); };
  await assert.rejects(flow.uploadWithRetry("/upload", { method: "PUT" }), /session expired/);
  assert.equal(attempts, 1);
});

test("all image-editing forms guard saving during uploads", async () => {
  for (const file of [
    "brands/BrandsAdmin.tsx", "categories/CategoriesAdmin.tsx", "blog/BlogForm.tsx",
    "store/info/StoreInfoForm.tsx", "store/pages/_editors/HomePageEditor.tsx", "store/pages/_editors/AboutPageEditor.tsx",
  ]) {
    const source = await readFile(`src/app/admin/(protected)/${file}`, "utf8");
    assert.match(source, /if \(imageUploading\) return;/, file);
    assert.match(source, /onUploadingChange=\{onUploadingChange\}/, file);
    assert.match(source, /pending \|\| imageUploading/, file);
  }
});
