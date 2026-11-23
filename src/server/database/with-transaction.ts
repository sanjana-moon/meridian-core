import type { PoolClient } from "@neondatabase/serverless";
import { getPool } from "@/server/database/connection";

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      console.error("Failed to roll back Neon transaction");
    }

    throw error;
  } finally {
    client.release();
  }
}
