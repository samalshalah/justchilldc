/**
 * /api/contact — contact form submissions.
 * Stub: logs to console. Wire to email/Twilio/Slack via integrations later.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(5).max(5000),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  console.log("[contact]", parsed.data);
  // TODO: send via store.order_confirmation_email or Twilio
  return NextResponse.json({ ok: true });
}
