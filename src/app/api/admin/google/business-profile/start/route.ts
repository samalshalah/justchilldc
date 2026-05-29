import { NextResponse } from "next/server";
import { createHmac, randomBytes } from "crypto";
import { isAdminSession } from "@/lib/admin-auth";
import {
  GOOGLE_BP_SCOPE,
  GOOGLE_BP_STATE_COOKIE,
  getGoogleRedirectUri,
  hasGoogleBusinessProfileCredentials,
} from "@/lib/google-business-profile";

function signState(secret: string, issuedAt: string, nonce: string): string {
  return createHmac("sha256", secret).update(`${issuedAt}.${nonce}`).digest("hex");
}

function advancedRedirect(req: Request, params: Record<string, string>) {
  const url = new URL("/admin/store/advanced", req.url);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !hasGoogleBusinessProfileCredentials()) {
    return advancedRedirect(req, { google_error: "missing_credentials" });
  }

  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString("hex");
  const state = `${issuedAt}.${nonce}.${signState(secret, issuedAt, nonce)}`;
  const redirectUri = getGoogleRedirectUri(req);

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID ?? "");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", GOOGLE_BP_SCOPE);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("prompt", "consent");

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(GOOGLE_BP_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/",
  });
  return res;
}
