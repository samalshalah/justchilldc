/**
 * storage.ts - Cloudflare R2-backed media storage.
 *
 * The app keeps its existing URL conventions:
 *   - /objects/<entity>     - admin-uploaded images
 *   - /public/<filename>    - public media assets
 *
 * Both are proxied through `/api/storage/[...path]/route.ts`, which accepts
 * the legacy paths above with `/api/storage` prefixed.
 */

import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { randomUUID } from "crypto";
import { isLocalPreviewMode } from "@/lib/preview";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
  }
}

function mediaBucket(): R2Bucket {
  const env = getCloudflareContext().env as CloudflareEnv;
  if (!env.MEDIA_BUCKET) {
    throw new Error("MEDIA_BUCKET R2 binding is not configured.");
  }
  return env.MEDIA_BUCKET;
}

function normalizeKey(path: string): string {
  return path.replace(/^\/+/, "");
}

function contentTypeFromKey(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

async function localObjectPath(key: string) {
  const [{ default: path }] = await Promise.all([import("path")]);
  const base = path.resolve(process.cwd(), ".local-r2", "media");
  const target = path.resolve(base, normalizeKey(key));
  if (!target.startsWith(base + path.sep)) {
    throw new Error("Invalid local storage path.");
  }
  return { base, target, metaTarget: `${target}.meta.json` };
}

async function getLocalObject(key: string): Promise<R2ObjectBody | null> {
  const [{ readFile, stat }] = await Promise.all([import("fs/promises")]);
  const paths = await localObjectPath(key);
  try {
    const [bytes, info] = await Promise.all([
      readFile(paths.target),
      stat(paths.target),
    ]);
    let contentType = contentTypeFromKey(key);
    try {
      const meta = JSON.parse(await readFile(paths.metaTarget, "utf8")) as {
        contentType?: string;
      };
      contentType = meta.contentType || contentType;
    } catch {
      // Metadata is optional for local preview files.
    }
    return {
      body: new Response(bytes).body!,
      httpMetadata: { contentType },
      size: info.size,
    };
  } catch {
    return null;
  }
}

async function putLocalObject({
  key,
  body,
  contentType,
}: {
  key: string;
  body: ReadableStream | ArrayBuffer;
  contentType?: string | null;
}): Promise<void> {
  const [{ mkdir, writeFile }, { default: path }] = await Promise.all([
    import("fs/promises"),
    import("path"),
  ]);
  const paths = await localObjectPath(key);
  await mkdir(path.dirname(paths.target), { recursive: true });
  const bytes =
    body instanceof ArrayBuffer ? body : await new Response(body).arrayBuffer();
  await writeFile(paths.target, Buffer.from(bytes));
  await writeFile(
    paths.metaTarget,
    JSON.stringify({ contentType: contentType || contentTypeFromKey(key) })
  );
}

export async function getEntityObject(entityPath: string): Promise<R2ObjectBody> {
  const norm = entityPath.startsWith("/") ? entityPath : `/${entityPath}`;
  if (!norm.startsWith("/objects/")) throw new ObjectNotFoundError();
  if (isLocalPreviewMode()) {
    const object = await getLocalObject(normalizeKey(norm));
    if (!object) throw new ObjectNotFoundError();
    return object;
  }
  const object = await mediaBucket().get(normalizeKey(norm));
  if (!object) throw new ObjectNotFoundError();
  return object;
}

export async function findPublicObject(filename: string): Promise<R2ObjectBody | null> {
  if (isLocalPreviewMode()) {
    return getLocalObject(`public/${normalizeKey(filename)}`);
  }
  return mediaBucket().get(`public/${normalizeKey(filename)}`);
}

export function streamObject(
  object: R2ObjectBody,
  { isPublic, cacheTtlSec = 3600 }: { isPublic?: boolean; cacheTtlSec?: number } = {},
): Response {
  const headers: Record<string, string> = {
    "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
    "Cache-Control": isPublic
      ? `public, max-age=${cacheTtlSec}, stale-while-revalidate=86400`
      : `private, max-age=${cacheTtlSec}`,
  };
  if (object.size) headers["Content-Length"] = String(object.size);
  return new Response(object.body, { headers });
}

export function getUploadTarget(): { uploadUrl: string; objectPath: string } {
  const objectId = randomUUID();
  const objectPath = `/objects/uploads/${objectId}`;
  return {
    uploadUrl: `/api/admin/upload-url?objectPath=${encodeURIComponent(objectPath)}`,
    objectPath,
  };
}

export async function putUploadedObject({
  objectPath,
  body,
  contentType,
}: {
  objectPath: string;
  body: ReadableStream | ArrayBuffer | null;
  contentType?: string | null;
}): Promise<void> {
  if (!body) throw new Error("Missing upload body.");
  const norm = objectPath.startsWith("/") ? objectPath : `/${objectPath}`;
  if (!norm.startsWith("/objects/uploads/")) {
    throw new Error("Invalid upload object path.");
  }
  const key = normalizeKey(norm);
  if (isLocalPreviewMode()) {
    await putLocalObject({ key, body, contentType });
    return;
  }
  await mediaBucket().put(key, body, {
    httpMetadata: {
      contentType: contentType || contentTypeFromKey(key),
    },
  });
}
