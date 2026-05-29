/**
 * db.ts — Drizzle ORM client.
 *
 * The schema lives in ./schema/ — ported from the legacy `lib/db` package
 * unchanged. Server-only: importing this from a client component will
 * (correctly) throw at build time.
 */

import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { cache } from "react";
import * as schema from "./schema";

function getDatabaseUrl(): string {
  try {
    const env = getCloudflareContext().env as CloudflareEnv;
    if (env.HYPERDRIVE?.connectionString) {
      return env.HYPERDRIVE.connectionString;
    }
  } catch {
    // Not running inside OpenNext/Workers yet; fall through to a clear error.
  }

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  throw new Error(
    "Database is not configured. Set DATABASE_URL locally or bind HYPERDRIVE in Cloudflare."
  );
}

export const getDb = cache(() => {
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
    max: 5,
    maxUses: 1,
  });

  return drizzle(pool, { schema });
});

type DbClient = ReturnType<typeof getDb>;

export const db = new Proxy({} as DbClient, {
  get(_target, prop) {
    const current = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = current[prop];
    return typeof value === "function" ? value.bind(current) : value;
  },
});
export * from "./schema";
