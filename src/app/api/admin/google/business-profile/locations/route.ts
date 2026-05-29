import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminSession } from "@/lib/admin-auth";
import {
  GOOGLE_BP_ACCESS_COOKIE,
  GoogleBusinessProfileError,
  fetchGoogleBusinessLocations,
} from "@/lib/google-business-profile";

export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(GOOGLE_BP_ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Google Business Profile is not connected" },
      { status: 409 }
    );
  }

  try {
    const result = await fetchGoogleBusinessLocations(accessToken);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[google-business-profile] location list failed:", err);
    if (err instanceof GoogleBusinessProfileError) {
      return NextResponse.json(
        {
          error: err.message,
          detail: err.detail,
          status: err.status,
        },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: "Could not read Google Business Profile locations" },
      { status: 502 }
    );
  }
}
