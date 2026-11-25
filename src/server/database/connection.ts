import { Pool } from "@neondatabase/serverless";
import { logger } from "@/server/utils/logger";

declare global {
  var meridianNeonPool: Pool | undefined;
}

export function getPool(): Pool {
  if (globalThis.meridianNeonPool) {
    return globalThis.meridianNeonPool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,        // close idle connections after 30 s
    connectionTimeoutMillis: 10_000,  // fail fast if DB is unreachable
    // Optional: for serverless, prefer Neon's pooled URL (host contains "-pooler").
    // If you already use it in DATABASE_URL, no code change needed here.
  });

  pool.on("error", (err) => {
    // Do NOT swallow the error object — log it with context.
    logger.error("Unexpected Neon pool error", { err });
  });

  globalThis.meridianNeonPool = pool;
  return pool;
}