import type { SiteSettings } from "./types";
import type { Order } from "./schema/orders";
import type { OrderItem } from "./schema/orderItems";

type OrderEmailOrder = Pick<
  Order,
  | "id"
  | "confirmationCode"
  | "customerName"
  | "customerEmail"
  | "customerPhone"
  | "preferredPickupTime"
  | "notes"
  | "totalPrice"
  | "createdAt"
> & {
  items: Pick<OrderItem, "productName" | "quantity" | "pricePerItem">[];
};

export interface OrderEmailMessage {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
}

interface BuildOrderEmailMessagesInput {
  settings: SiteSettings;
  order: OrderEmailOrder;
  siteUrl: string;
  fromEmail: string | undefined;
}

interface SendOrderEmailMessagesInput {
  apiKey: string | undefined;
  messages: OrderEmailMessage[];
  fetcher?: (input: string, init?: RequestInit) => Promise<Response>;
}

export interface OrderEmailSendResult {
  sent: number;
  failed: number;
  errors: string[];
}

function clean(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value: number): string {
  return `$${value.toFixed(2).replace(/\.00$/, "")}`;
}

function normalizeEmail(value: string | null | undefined): string | null {
  const email = clean(value);
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function normalizeEmailList(value: string | null | undefined): string[] {
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const part of clean(value).split(/[,\n;]/)) {
    const email = normalizeEmail(part);
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    emails.push(email);
  }
  return emails;
}

function normalizeResendApiKey(value: string | undefined): string | null {
  let key = clean(value);
  for (let i = 0; i < 3; i++) {
    key = key
      .replace(/^["']|["']$/g, "")
      .replace(/^Bearer\s+/i, "")
      .trim();
  }
  key = key.match(/re_[A-Za-z0-9_-]+/)?.[0] ?? key;
  return key || null;
}

function normalizeBaseUrl(value: string): string {
  return clean(value).replace(/\/+$/, "") || "https://justchilldc.com";
}

function displayName(value: string | null | undefined): string {
  return clean(value).replace(/[<>]/g, "") || "Store";
}

function firstPresent(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const next = clean(value);
    if (next) return next;
  }
  return "";
}

function buildItemsText(order: OrderEmailOrder): string {
  return order.items
    .map(
      (item) =>
        `- ${item.quantity} x ${item.productName} (${money(item.pricePerItem)} each)`
    )
    .join("\n");
}

function buildItemsHtml(order: OrderEmailOrder): string {
  return order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
            ${escapeHtml(item.productName)}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:center;">
            ${item.quantity}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;">
            ${money(item.pricePerItem)}
          </td>
        </tr>`
    )
    .join("");
}

export function defaultOrderFromEmail(settings: SiteSettings, siteUrl: string): string {
  const domainCandidate = firstPresent(
    settings.store?.custom_domain,
    settings.store?.website,
    siteUrl
  );

  try {
    const url = domainCandidate.includes("://")
      ? new URL(domainCandidate)
      : new URL(`https://${domainCandidate}`);
    const host = url.hostname.replace(/^www\./, "");
    if (host && host.includes(".")) return `orders@${host}`;
  } catch {
    // Fall through to production default.
  }

  return "orders@justchilldc.com";
}

export function buildOrderEmailMessages({
  settings,
  order,
  siteUrl,
  fromEmail,
}: BuildOrderEmailMessagesInput): OrderEmailMessage[] {
  if (!settings.store?.order_confirmation_enabled) return [];

  const fromAddress = normalizeEmail(fromEmail);
  const customerEmail = normalizeEmail(order.customerEmail);
  if (!fromAddress || !customerEmail) return [];

  const storeName = displayName(settings.store?.name);
  const baseUrl = normalizeBaseUrl(siteUrl);
  const orderUrl = `${baseUrl}/order/${order.id}`;
  const storeRecipients = normalizeEmailList(
    settings.store?.order_confirmation_email ?? settings.contact?.email
  );
  const primaryStoreRecipient = storeRecipients[0];
  const storePhone = firstPresent(settings.contact?.phone, settings.location?.phone, settings.store?.phone);
  const pickupAddress = firstPresent(settings.location?.address, settings.store?.address);
  const from = `${storeName} <${fromAddress}>`;
  const safeName = escapeHtml(storeName);
  const safeCode = escapeHtml(order.confirmationCode);
  const safePickupTime = escapeHtml(order.preferredPickupTime);
  const safeCustomerName = escapeHtml(order.customerName);
  const safeCustomerPhone = escapeHtml(order.customerPhone);
  const safeNotes = escapeHtml(clean(order.notes) || "None");
  const safeOrderUrl = escapeHtml(orderUrl);
  const safePickupAddress = escapeHtml(pickupAddress);
  const itemRows = buildItemsHtml(order);
  const itemText = buildItemsText(order);

  const customerText = [
    `${storeName} received your pickup order.`,
    `Confirmation code: ${order.confirmationCode}`,
    `Pickup time: ${order.preferredPickupTime}`,
    pickupAddress ? `Pickup address: ${pickupAddress}` : "",
    storePhone ? `Store phone: ${storePhone}` : "",
    "",
    "Items:",
    itemText,
    "",
    `Total Price: ${money(order.totalPrice)}`,
    `View order: ${orderUrl}`,
    "",
    "Please bring a valid government-issued ID for pickup.",
  ]
    .filter(Boolean)
    .join("\n");

  const customerHtml = `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
      <h1 style="font-size:22px;margin:0 0 12px;">${safeName} received your pickup order</h1>
      <p style="margin:0 0 16px;">Thanks ${safeCustomerName}. Your confirmation code is <strong>${safeCode}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tbody>
          <tr><td style="padding:4px 0;color:#6b7280;">Pickup time</td><td style="padding:4px 0;text-align:right;">${safePickupTime}</td></tr>
          ${
            safePickupAddress
              ? `<tr><td style="padding:4px 0;color:#6b7280;">Pickup address</td><td style="padding:4px 0;text-align:right;">${safePickupAddress}</td></tr>`
              : ""
          }
          ${
            storePhone
              ? `<tr><td style="padding:4px 0;color:#6b7280;">Store phone</td><td style="padding:4px 0;text-align:right;">${escapeHtml(storePhone)}</td></tr>`
              : ""
          }
        </tbody>
      </table>
      <h2 style="font-size:16px;margin:18px 0 8px;">Order items</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:8px 0;text-align:left;border-bottom:2px solid #111827;">Item</th>
            <th style="padding:8px 0;text-align:center;border-bottom:2px solid #111827;">Qty</th>
            <th style="padding:8px 0;text-align:right;border-bottom:2px solid #111827;">Each</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style="font-size:18px;margin:18px 0;"><strong>Total Price: ${money(order.totalPrice)}</strong></p>
      <p><a href="${safeOrderUrl}" style="color:#047857;font-weight:bold;">View your order</a></p>
      <p style="margin-top:18px;color:#6b7280;font-size:13px;">Please bring a valid government-issued ID for pickup.</p>
    </div>`;

  const messages: OrderEmailMessage[] = [
    {
      from,
      to: customerEmail,
      subject: `${storeName} pickup order ${order.confirmationCode}`,
      html: customerHtml,
      text: customerText,
      reply_to: primaryStoreRecipient,
    },
  ];

  if (storeRecipients.length > 0) {
    const storeText = [
      `New pickup order for ${storeName}`,
      `Confirmation code: ${order.confirmationCode}`,
      `Customer: ${order.customerName}`,
      `Email: ${customerEmail}`,
      `Phone: ${order.customerPhone}`,
      `Pickup time: ${order.preferredPickupTime}`,
      `Notes: ${clean(order.notes) || "None"}`,
      "",
      "Items:",
      itemText,
      "",
      `Total Price: ${money(order.totalPrice)}`,
      `Admin/order link: ${orderUrl}`,
    ].join("\n");

    const storeHtml = `
      <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
        <h1 style="font-size:22px;margin:0 0 12px;">New pickup order</h1>
        <p style="margin:0 0 16px;"><strong>${safeCode}</strong> for ${safeName}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tbody>
            <tr><td style="padding:4px 0;color:#6b7280;">Customer</td><td style="padding:4px 0;text-align:right;">${safeCustomerName}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Email</td><td style="padding:4px 0;text-align:right;">${escapeHtml(customerEmail)}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Phone</td><td style="padding:4px 0;text-align:right;">${safeCustomerPhone}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Pickup time</td><td style="padding:4px 0;text-align:right;">${safePickupTime}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Notes</td><td style="padding:4px 0;text-align:right;">${safeNotes}</td></tr>
          </tbody>
        </table>
        <h2 style="font-size:16px;margin:18px 0 8px;">Order items</h2>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="padding:8px 0;text-align:left;border-bottom:2px solid #111827;">Item</th>
              <th style="padding:8px 0;text-align:center;border-bottom:2px solid #111827;">Qty</th>
              <th style="padding:8px 0;text-align:right;border-bottom:2px solid #111827;">Each</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p style="font-size:18px;margin:18px 0;"><strong>Total Price: ${money(order.totalPrice)}</strong></p>
        <p><a href="${safeOrderUrl}" style="color:#047857;font-weight:bold;">Open order</a></p>
      </div>`;

    for (const storeRecipient of storeRecipients) {
      messages.push({
        from,
        to: storeRecipient,
        subject: `New pickup order ${order.confirmationCode} - ${storeName}`,
        html: storeHtml,
        text: storeText,
        reply_to: customerEmail,
      });
    }
  }

  return messages;
}

export async function sendOrderEmailMessages({
  apiKey,
  messages,
  fetcher = fetch,
}: SendOrderEmailMessagesInput): Promise<OrderEmailSendResult> {
  if (!messages.length) return { sent: 0, failed: 0, errors: [] };
  const normalizedApiKey = normalizeResendApiKey(apiKey);
  if (!normalizedApiKey) {
    return {
      sent: 0,
      failed: messages.length,
      errors: ["RESEND_API_KEY is not configured."],
    };
  }

  let sent = 0;
  const errors: string[] = [];

  for (const message of messages) {
    try {
      const payload = {
        from: message.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      };

      const res = await fetcher("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${normalizedApiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "justchilldc.com/1.0",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const responseMeta = [
          res.statusText,
          res.headers.get("content-type")
            ? `content-type=${res.headers.get("content-type")}`
            : "",
          res.headers.get("retry-after")
            ? `retry-after=${res.headers.get("retry-after")}`
            : "",
        ]
          .filter(Boolean)
          .join("; ");
        throw new Error(
          `Resend HTTP ${res.status}${responseMeta ? ` ${responseMeta}` : ""}${
            body ? `: ${body}` : ""
          }`
        );
      }

      sent += 1;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Unknown email error");
    }
  }

  return {
    sent,
    failed: errors.length,
    errors,
  };
}
