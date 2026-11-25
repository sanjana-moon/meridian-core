export { getPool } from "@/server/database/connection";

export interface AccountRow {
  id: string;
  owner_id: string;
  account_number: string;
  balance: string;
  status: string;
  max_single_transaction: string;
  daily_transfer_limit: string;
  minimum_balance: string;
}
