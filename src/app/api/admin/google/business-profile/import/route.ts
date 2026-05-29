import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminSession } from "@/lib/admin-auth";
import {
  GOOGLE_BP_ACCESS_COOKIE,
  fetchGoogleBusinessLocation,
  mapGoogleLocationToSettings,
} from "@/lib/google-business-profile";
import { getSiteSettings } from "@/lib/settings";
import { writeSettingSlice } from "@/lib/settings-write";

const Body = z.object({
  accountName: z.string().min(1),
  locationName: z.string().min(1),
});

export async function POST(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing Google location" }, { status: 400 });
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
    const [existing, googleLocation] = await Promise.all([
      getSiteSettings(),
      fetchGoogleBusinessLocation(accessToken, parsed.data.locationName),
    ]);

    const settings = mapGoogleLocationToSettings({
      accountName: parsed.data.accountName,
      location: googleLocation,
      existing,
    });

    await writeSettingSlice("store", settings.store);
    await writeSettingSlice("location", settings.location);
    await writeSettingSlice("contact", settings.contact);
    await writeSettingSlice("seo", settings.seo);
    await writeSettingSlice("integrations", settings.integrations);

    revalidatePath("/", "layout");

    return NextResponse.json({
      ok: true,
      imported: {
        store: settings.store,
        location: settings.location,
        contact: settings.contact,
        seo: settings.seo,
        integrations: settings.integrations,
      },
    });
  } catch (err) {
    console.error("[google-business-profile] import failed:", err);
    return NextResponse.json(
      { error: "Could not import Google Business Profile information" },
      { status: 502 }
    );
  }
}
