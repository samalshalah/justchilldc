/**
 * /api/orders — order creation and retrieval.
 *
 * Improvements over legacy:
 *   - Uses `inArray` for one-shot product lookup (kills the N+1).
 *   - Wraps order + items + inventory updates in a transaction.
 *   - Decrements `quantity` and flips `inStock` when stock hits zero.
 *   - Server recomputes the deal discount from cart contents (legacy
 *     trusted the client total, exploitable once payments wire up).
 *   - Crypto-strong confirmation code with collision retry.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { inArray, eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import {
  db,
  productsTable,
  ordersTable,
  orderItemsTable,
} from "@/lib/db";
import { getSiteSettings, invalidateSettings } from "@/lib/settings";
import { computeBestDeal } from "@/lib/deal-engine";
import { DEFAULTS } from "@/lib/defaults";
import { getOrderById } from "@/lib/data";
import {
  buildOrderEmailMessages,
  defaultOrderFromEmail,
  sendOrderEmailMessages,
} from "@/lib/order-email";

const Body = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  preferredPickupTime: z.string().min(1),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive().max(99),
      })
    )
    .min(1)
    .max(50),
});

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateConfirmationCode(): string {
  const bytes = randomBytes(6);
  let code = DEFAULTS.confirmationCodePrefix;
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request: " + parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Check ordering not paused
  const settings = await getSiteSettings();
  if (settings.ordering?.pause_all_orders) {
    return NextResponse.json(
      { error: "Orders are temporarily paused. Please try again later." },
      { status: 503 }
    );
  }

  try {
    // One-shot product lookup
    const productIds = data.items.map((i) => i.productId);
    const products = await db
      .select()
      .from(productsTable)
      .where(inArray(productsTable.id, productIds));

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products not found." },
        { status: 400 }
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate stock + compute server-side total
    const itemDetails = data.items.map((item) => {
      const product = productMap.get(item.productId)!;
      if (!product.inStock) {
        throw new Error(`${product.name} is out of stock.`);
      }
      if (
        product.quantity != null &&
        product.quantity < item.quantity
      ) {
        throw new Error(
          `Not enough stock for ${product.name}: only ${product.quantity} available.`
        );
      }
      return {
        product,
        item,
        lineTotal: product.price * item.quantity,
      };
    });

    const subtotal = itemDetails.reduce((s, x) => s + x.lineTotal, 0);

    // Server recompute of best deal (don't trust client)
    const enabledDeals = (settings.deal_rules ?? []).filter((d) => d.enabled);
    const deal = computeBestDeal(
      enabledDeals,
      data.items.map((i) => {
        const p = productMap.get(i.productId)!;
        return { productId: i.productId, price: p.price, quantity: i.quantity };
      }),
      subtotal
    );
    const totalPrice = Math.round(
      Math.max(0, subtotal - (deal?.discountAmount ?? 0))
    );

    // Transaction: insert order, insert items, decrement inventory
    const result = await db.transaction(async (tx) => {
      // Generate code with up to 5 retries on collision
      let code: string | null = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateConfirmationCode();
        const existing = await tx
          .select({ id: ordersTable.id })
          .from(ordersTable)
          .where(eq(ordersTable.confirmationCode, candidate))
          .limit(1);
        if (existing.length === 0) {
          code = candidate;
          break;
        }
      }
      if (!code) throw new Error("Could not generate confirmation code");

      const [order] = await tx
        .insert(ordersTable)
        .values({
          confirmationCode: code,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          preferredPickupTime: data.preferredPickupTime,
          notes: data.notes ?? null,
          status: "pending",
          totalPrice,
        })
        .returning();

      const orderItems = await Promise.all(
        itemDetails.map(({ product, item }) =>
          tx
            .insert(orderItemsTable)
            .values({
              orderId: order.id,
              productId: item.productId,
              productName: product.name,
              quantity: item.quantity,
              pricePerItem: product.price,
            })
            .returning()
            .then((rows) => rows[0])
        )
      );

      // Decrement inventory; if quantity is null (untracked), skip
      for (const { product, item } of itemDetails) {
        if (product.quantity != null) {
          const newQty = product.quantity - item.quantity;
          await tx
            .update(productsTable)
            .set({
              quantity: sql`${productsTable.quantity} - ${item.quantity}`,
              inStock: newQty > 0,
            })
            .where(eq(productsTable.id, product.id));
        }
      }

      return { ...order, items: orderItems };
    });

    // Invalidate settings cache so admin sees fresh order list immediately
    invalidateSettings();

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
    const emailMessages = buildOrderEmailMessages({
      settings,
      order: result,
      siteUrl,
      fromEmail:
        process.env.RESEND_FROM_EMAIL ??
        defaultOrderFromEmail(settings, siteUrl),
    });
    const emailResult = await sendOrderEmailMessages({
      apiKey: process.env.RESEND_API_KEY,
      messages: emailMessages,
    });
    if (emailResult.failed > 0) {
      console.warn("[orders] email send failed:", emailResult.errors);
    }

    console.log(
      "[orders] new order:",
      result.confirmationCode,
      result.customerEmail,
      `$${totalPrice}`
    );

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[orders] create failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Order failed. Please try again.",
      },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const idStr = url.searchParams.get("id");
  if (!idStr) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const id = parseInt(idStr, 10);
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json(order);
}
