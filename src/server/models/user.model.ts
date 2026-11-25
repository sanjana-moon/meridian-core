export { getPool } from "@/server/database/connection";

export interface CreatedUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
}
