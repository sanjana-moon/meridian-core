import { Pool } from "@neondatabase/serverless";

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

  const pool = new Pool({ connectionString, max: 5 });
  pool.on("error", () => console.error("Unexpected Neon connection pool error"));
  globalThis.meridianNeonPool = pool;
  return pool;
}
