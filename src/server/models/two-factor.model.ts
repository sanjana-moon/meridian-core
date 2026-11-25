export { getPool } from "@/server/database/connection";

export interface TwoFactorSecret {
  secret_ciphertext: string;
  enabled: boolean;
}
