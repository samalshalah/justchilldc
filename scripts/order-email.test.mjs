import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";

async function importOrderEmailModule() {
  const sourcePath = path.resolve("src/lib/order-email.ts");
  const source = await readFile(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
  });
  const dir = await mkdtemp(path.join(tmpdir(), "order-email-"));
  const compiledPath = path.join(dir, "order-email.mjs");
  await writeFile(compiledPath, compiled.outputText, "utf8");
  return import(pathToFileURL(compiledPath).href);
}

const mod = await importOrderEmailModule();

const baseOrder = {
  id: 123,
  confirmationCode: "JC-ABC123",
  customerName: "Sam Customer",
  customerEmail: "customer@example.com",
  customerPhone: "(202) 555-0100",
  preferredPickupTime: "Today after 5 PM",
  notes: "Please call when ready.",
  status: "pending",
  totalPrice: 60,
  createdAt: new Date("2026-05-30T14:00:00Z"),
  items: [
    {
      id: 1,
      orderId: 123,
      productId: 10,
      productName: "Blue Dream CBD",
      quantity: 2,
      pricePerItem: 30,
    },
  ],
};

const baseSettings = {
  store: {
    name: "Just Chill DC",
    order_confirmation_enabled: true,
    order_confirmation_email: "orders@example.com",
  },
  location: {
    address: "1314B 9th St NW, Washington DC 20001",
    city: "Washington",
    state: "DC",
  },
  contact: {
    phone: "(202) 481-1676",
  },
};

test("builds customer and store pickup emails when enabled", () => {
  const messages = mod.buildOrderEmailMessages({
    settings: baseSettings,
    order: baseOrder,
    siteUrl: "https://justchilldc.com",
    fromEmail: "orders@justchilldc.com",
  });

  assert.equal(messages.length, 2);
  assert.equal(messages[0].to, "customer@example.com");
  assert.equal(messages[1].to, "orders@example.com");
  assert.match(messages[0].subject, /JC-ABC123/);
  assert.match(messages[0].html, /Blue Dream CBD/);
  assert.match(messages[0].html, /https:\/\/justchilldc\.com\/order\/123/);
  assert.equal(messages[1].reply_to, "customer@example.com");
});

test("does not build emails when order emails are disabled", () => {
  const messages = mod.buildOrderEmailMessages({
    settings: {
      ...baseSettings,
      store: { ...baseSettings.store, order_confirmation_enabled: false },
    },
    order: baseOrder,
    siteUrl: "https://justchilldc.com",
    fromEmail: "orders@justchilldc.com",
  });

  assert.deepEqual(messages, []);
});

test("uses contact email as the store notification fallback", () => {
  const messages = mod.buildOrderEmailMessages({
    settings: {
      ...baseSettings,
      store: {
        name: "Just Chill DC",
        order_confirmation_enabled: true,
      },
      contact: {
        email: "manager@example.com",
        phone: "(202) 481-1676",
      },
    },
    order: baseOrder,
    siteUrl: "https://justchilldc.com",
    fromEmail: "orders@justchilldc.com",
  });

  assert.equal(messages.length, 2);
  assert.equal(messages[1].to, "manager@example.com");
});

test("builds one store notification for each configured notification email", () => {
  const messages = mod.buildOrderEmailMessages({
    settings: {
      ...baseSettings,
      store: {
        ...baseSettings.store,
        order_confirmation_email:
          "justchill1314@icloud.com, sam.alshalah1@gmail.com",
      },
    },
    order: baseOrder,
    siteUrl: "https://justchilldc.com",
    fromEmail: "orders@justchilldc.com",
  });

  assert.equal(messages.length, 3);
  assert.equal(messages[1].to, "justchill1314@icloud.com");
  assert.equal(messages[2].to, "sam.alshalah1@gmail.com");
  assert.equal(messages[1].reply_to, "customer@example.com");
  assert.equal(messages[2].reply_to, "customer@example.com");
});

test("send payload only includes Resend REST email fields", async () => {
  let parsedBody;
  const response = await mod.sendOrderEmailMessages({
    apiKey: "re_test",
    messages: [
      {
        from: "Just Chill DC <orders@justchilldc.com>",
        to: "customer@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        text: "Test",
        reply_to: "staff@example.com",
      },
    ],
    fetcher: async (_url, init) => {
      parsedBody = JSON.parse(init.body);
      return new Response(JSON.stringify({ id: "email_123" }), { status: 200 });
    },
  });

  assert.equal(response.sent, 1);
  assert.deepEqual(Object.keys(parsedBody).sort(), [
    "from",
    "html",
    "subject",
    "text",
    "to",
  ]);
});

test("send request includes a user agent header", async () => {
  let headers;
  const response = await mod.sendOrderEmailMessages({
    apiKey: "re_test",
    messages: [
      {
        from: "Just Chill DC <orders@justchilldc.com>",
        to: "customer@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        text: "Test",
      },
    ],
    fetcher: async (_url, init) => {
      headers = init.headers;
      return new Response(JSON.stringify({ id: "email_123" }), { status: 200 });
    },
  });

  assert.equal(response.sent, 1);
  assert.equal(headers["User-Agent"], "justchilldc.com/1.0");
});

test("send request normalizes bearer-prefixed API keys", async () => {
  let headers;
  const response = await mod.sendOrderEmailMessages({
    apiKey: "Bearer re_test",
    messages: [
      {
        from: "Just Chill DC <orders@justchilldc.com>",
        to: "customer@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        text: "Test",
      },
    ],
    fetcher: async (_url, init) => {
      headers = init.headers;
      return new Response(JSON.stringify({ id: "email_123" }), { status: 200 });
    },
  });

  assert.equal(response.sent, 1);
  assert.equal(headers.Authorization, "Bearer re_test");
});

test("send request normalizes quoted bearer-prefixed API keys", async () => {
  let headers;
  const response = await mod.sendOrderEmailMessages({
    apiKey: '"Bearer re_test"',
    messages: [
      {
        from: "Just Chill DC <orders@justchilldc.com>",
        to: "customer@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        text: "Test",
      },
    ],
    fetcher: async (_url, init) => {
      headers = init.headers;
      return new Response(JSON.stringify({ id: "email_123" }), { status: 200 });
    },
  });

  assert.equal(response.sent, 1);
  assert.equal(headers.Authorization, "Bearer re_test");
});

test("send request extracts API keys from env-style secret values", async () => {
  let headers;
  const response = await mod.sendOrderEmailMessages({
    apiKey: "RESEND_API_KEY=re_test",
    messages: [
      {
        from: "Just Chill DC <orders@justchilldc.com>",
        to: "customer@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        text: "Test",
      },
    ],
    fetcher: async (_url, init) => {
      headers = init.headers;
      return new Response(JSON.stringify({ id: "email_123" }), { status: 200 });
    },
  });

  assert.equal(response.sent, 1);
  assert.equal(headers.Authorization, "Bearer re_test");
});
