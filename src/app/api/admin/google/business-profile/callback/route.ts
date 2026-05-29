import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac } from "crypto";
import { isAdminSession } from "@/lib/admin-auth";
import {
  GOOGLE_BP_ACCESS_COOKIE,
  GOOGLE_BP_ACCESS_MAX_AGE_SEC,
  GOOGLE_BP_STATE_COOKIE,
  exchangeGoogleCode,
  getGoogleRedirectUri,
  hasGoogleBusinessProfileCredentials,
} from "@/lib/google-business-profile";

function advancedRedirect(req: Request, params: Record<string, string>) {
  const url = new URL("/admin/store/advanced", req.url);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return NextResponse.redirect(url);
}

function validState(input: {
  state: string;
  cookieState: string | undefined;
  secret: string;
}): boolean {
  if (!input.cookieState || input.cookieState !== input.state) return false;

  const [issuedAt, nonce, sig] = input.state.split(".");
  if (!issuedAt || !nonce || !sig) return false;

  const ageSec = Math.floor(Date.now() / 1000) - parseInt(issuedAt, 10);
  if (!Number.isFinite(ageSec) || ageSec < 0 || ageSec > 10 * 60) return false;

  const expected = createHmac("sha256", input.secret)
    .update(`${issuedAt}.${nonce}`)
    .digest("hex");

  return expected === sig;
}

export async function GET(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !hasGoogleBusinessProfileCredentials()) {
    return advancedRedirect(req, { google_error: "missing_credentials" });
  }

  const url = new URL(req.url);
  const error = url.searchParams.get("error");
  if (error) return advancedRedirect(req, { google_error: error });

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";
  const cookieStore = await cookies();
  const cookieState = cookieStore.get(GOOGLE_BP_STATE_COOKIE)?.value;

  if (!code || !validState({ state, cookieState, secret })) {
    return advancedRedirect(req, { google_error: "bad_state" });
  }

  try {
    const token = await exchangeGoogleCode({
      code,
      redirectUri: getGoogleRedirectUri(req),
    });

    const res = advancedRedirect(req, { google: "connected" });
    res.cookies.delete(GOOGLE_BP_STATE_COOKIE);
    res.cookies.set(GOOGLE_BP_ACCESS_COOKIE, token.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: Math.min(token.expires_in ?? GOOGLE_BP_ACCESS_MAX_AGE_SEC, GOOGLE_BP_ACCESS_MAX_AGE_SEC),
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[google-business-profile] OAuth callback failed:", err);
    return advancedRedirect(req, { google_error: "oauth_failed" });
  }
}
