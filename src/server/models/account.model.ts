export { getPool } from "@/server/database/connection";

export interface AccountRecord {
  id: string;
  owner_id: string;
  account_number: string;
  balance: string;
  status: string;
}
