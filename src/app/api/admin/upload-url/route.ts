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

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  try {
    const { uploadUrl, objectPath } = getUploadTarget();
    return NextResponse.json({ uploadUrl, objectPath });
  } catch (err) {
    console.error("[upload-url] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload URL failed" },
      { status: 500 }
    );
  }
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
    const body = await req.arrayBuffer();
    if (body.byteLength === 0) {
      return NextResponse.json({ error: "Missing upload body" }, { status: 400 });
    }
    await putUploadedObject({
      objectPath,
      body,
      contentType: req.headers.get("content-type"),
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
