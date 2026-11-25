export { getPool } from "@/server/database/connection";

export interface LoanRecord {
  id: string;
  customer_id: string;
  account_id: string | null;
  status: string;
}
