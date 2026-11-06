/**
 * /api/admin/upload-url — issue a signed URL the admin can PUT a file to.
 *
 * Gated by the same session cookie as the rest of /admin. Returns
 * { uploadUrl, objectPath }. The objectPath is what gets saved to the DB.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac } from "crypto";
import { getUploadTarget, putUploadedObject } from "@/lib/storage";
import { MAX_IMAGE_UPLOAD_BYTES, parseImageVariantWidth } from "@/lib/image-variants";
import { getProducts } from "@/lib/data";

const COOKIE_NAME = "jc_admin_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function hmacHex(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message).digest("hex");
}

async function isAdmin(): Promise<boolean> {
  const c = await cookies();
  const cookie = c.get(COOKIE_NAME);
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !cookie?.value) return false;
  const [issuedAtStr, sig] = cookie.value.split(".");
  if (!issuedAtStr || !sig) return false;
  const issuedAt = parseInt(issuedAtStr, 10);
  if (isNaN(issuedAt)) return false;
  const ageSec = Math.floor(Date.now() / 1000) - issuedAt;
  if (ageSec < 0 || ageSec > SESSION_MAX_AGE_SEC) return false;
  return hmacHex(secret, issuedAtStr) === sig;
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  try {
    const input = (await req.json().catch(() => ({}))) as {
      filename?: string;
      contentType?: string;
      nameHint?: string;
      folder?: string;
      entityId?: string | number | null;
    };
    const { uploadUrl, objectPath } = getUploadTarget(input);
    return NextResponse.json({ uploadUrl, objectPath });
  } catch (err) {
    console.error("[upload-url] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload URL failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const products = await getProducts({});
  const paths = new Set<string>();
  for (const product of products) {
    for (const path of [product.imageUrl, product.brandLogoUrl]) {
      const normalized = path?.replace(/^\/api\/storage/, "");
      if (normalized?.startsWith("/objects/uploads/")) paths.add(normalized);
    }
  }
  return NextResponse.json({ paths: [...paths] }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  try {
    const url = new URL(req.url);
    const objectPath = url.searchParams.get("objectPath");
    if (!objectPath) {
      return NextResponse.json({ error: "Missing objectPath" }, { status: 400 });
    }
    const requestedWidth = url.searchParams.get("width");
    const width = parseImageVariantWidth(requestedWidth);
    if (requestedWidth && !width) {
      return NextResponse.json({ error: "Unsupported image width" }, { status: 400 });
    }
    if (width && req.headers.get("content-type") !== "image/webp") {
      return NextResponse.json({ error: "Image variants must use WebP" }, { status: 415 });
    }
    const body = await req.arrayBuffer();
    if (body.byteLength > MAX_IMAGE_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Maximum image size is 20 MB" }, { status: 413 });
    }
    if (body.byteLength === 0) {
      return NextResponse.json({ error: "Missing upload body" }, { status: 400 });
    }
    await putUploadedObject({
      objectPath,
      body,
      contentType: req.headers.get("content-type"),
      width,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
