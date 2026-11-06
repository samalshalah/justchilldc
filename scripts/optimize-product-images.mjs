import { parseArgs } from "node:util";
import { createHash } from "node:crypto";
import sharp from "sharp";

const { values } = parseArgs({
  options: {
    site: { type: "string" },
    apply: { type: "boolean", default: false },
    force: { type: "boolean", default: false },
    limit: { type: "string" },
  },
});
if (!values.site || !process.env.ADMIN_PASSWORD) {
  throw new Error("Set ADMIN_PASSWORD and pass --site=https://your-store.example. Add --apply to upload variants.");
}
const site = new URL(values.site);
if (site.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(site.hostname)) {
  throw new Error("Use HTTPS for a live store.");
}
const widths = [320, 640, 1280];
const login = await fetch(new URL("/api/admin/login", site), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
  redirect: "error",
});
if (!login.ok) throw new Error(`Admin sign-in failed: ${login.status}`);
const cookie = login.headers.getSetCookie().find((value) => value.startsWith("jc_admin_session="))?.split(";")[0];
if (!cookie) throw new Error("Admin session cookie was not returned.");
const manifest = await fetch(new URL("/api/admin/upload-url", site), {
  headers: { Cookie: cookie },
  redirect: "error",
});
if (!manifest.ok) throw new Error(`Image manifest failed: ${manifest.status}`);
const { paths } = await manifest.json();
if (!Array.isArray(paths) || paths.some((path) => typeof path !== "string" || !path.startsWith("/objects/uploads/"))) {
  throw new Error("Invalid image manifest.");
}
const limit = values.limit ? Number(values.limit) : paths.length;
if (!Number.isInteger(limit) || limit < 0 || (values.limit && limit < 1)) {
  throw new Error("Limit must be a positive integer.");
}
const encoded = new Map();
const stats = { images: 0, alreadyOptimized: 0, skipped: 0, failed: 0, originalBytes: 0, thumbnailBytes: 0, detailBytes: 0 };
for (const objectPath of paths.slice(0, limit)) {
  try {
    const sourceUrl = new URL(`/api/storage${objectPath}`, site);
    const missing = [];
    for (const width of widths) {
      const probe = new URL(sourceUrl);
      probe.searchParams.set("width", String(width));
      const response = await fetch(probe, { method: "HEAD" });
      if (values.force || response.headers.get("X-Image-Width") !== String(width)) missing.push(width);
    }
    if (!missing.length) {
      stats.alreadyOptimized++;
      continue;
    }
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`Source returned ${response.status}`);
    const contentType = response.headers.get("content-type")?.split(";")[0];
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(contentType)) {
      stats.skipped++;
      continue;
    }
    const source = Buffer.from(await response.arrayBuffer());
    const hash = createHash("sha256").update(source).digest("hex");
    let variants = encoded.get(hash);
    if (!variants) {
      variants = new Map();
      for (const width of widths) {
        variants.set(width, await sharp(source, { limitInputPixels: 40_000_000 })
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 82, effort: 5 })
          .toBuffer());
      }
      encoded.set(hash, variants);
    }
    if (values.apply) {
      for (const width of missing) {
        const uploadUrl = new URL("/api/admin/upload-url", site);
        uploadUrl.searchParams.set("objectPath", objectPath);
        uploadUrl.searchParams.set("width", String(width));
        const upload = await fetch(uploadUrl, {
          method: "PUT",
          headers: { Cookie: cookie, "Content-Type": "image/webp" },
          body: variants.get(width),
          redirect: "error",
        });
        if (!upload.ok) throw new Error(`Variant ${width} upload failed: ${upload.status}`);
      }
    }
    stats.images++;
    stats.originalBytes += source.length;
    stats.thumbnailBytes += variants.get(320).length;
    stats.detailBytes += variants.get(1280).length;
    if (stats.images % 10 === 0) console.log(JSON.stringify({ mode: values.apply ? "apply" : "dry-run", ...stats }));
  } catch (error) {
    stats.failed++;
    console.error(JSON.stringify({ path: objectPath, error: error.message }));
  }
}
console.log(JSON.stringify({ mode: values.apply ? "apply" : "dry-run", ...stats }));
if (stats.failed) process.exitCode = 1;
