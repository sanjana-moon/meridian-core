import type { PoolClient } from "@neondatabase/serverless";
import { getPool } from "@/server/database/connection";
import { logger } from "@/server/utils/logger";

export interface TransactionOptions {
  /**
   * Isolation level. For money movements use "serializable" or
   * at least "repeatable read". Defaults to "read committed" (safe with
   * explicit SELECT ... FOR UPDATE locking).
   */
  isolation?: "read committed" | "repeatable read" | "serializable";
  /** Query timeout in milliseconds to prevent hung financial transactions. */
  timeoutMs?: number;
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
  options: TransactionOptions = {},
): Promise<T> {
  const { isolation = "read committed", timeoutMs = 15_000 } = options;
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    if (isolation !== "read committed") {
      await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolation.toUpperCase()}`);
    }
    // Force a statement timeout inside the transaction.
    await client.query(`SET LOCAL statement_timeout = ${timeoutMs}`);

    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      logger.error("Failed to roll back Neon transaction", { rollbackError, error });
    }
    throw error;
  } finally {
    client.release();
  }
}