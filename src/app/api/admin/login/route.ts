/**
 * /api/admin/login — issue a signed session cookie if password matches.
 *
 * The cookie is the same format the middleware verifies:
 *   `<unix_seconds>.<hmac-sha256(secret, unix_seconds)>`
 *
 * Logout: just expire the cookie via /api/admin/logout (POST).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "jc_admin_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

const Body = z.object({ password: z.string().min(1) });

function hmacHex(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message).digest("hex");
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing password" }, { status: 400 });
  }
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured." },
      { status: 500 }
    );
  }
  // Constant-time compare to avoid leaking length
  const a = Buffer.from(parsed.data.password.padEnd(secret.length, "\0"));
  const b = Buffer.from(secret.padEnd(a.length, "\0"));
  const ok = a.length === b.length && timingSafeEqual(a, b) && parsed.data.password.length === secret.length;
  if (!ok) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const value = `${issuedAt}.${hmacHex(secret, issuedAt)}`;

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SEC,
    path: "/",
  });
  return res;
}
