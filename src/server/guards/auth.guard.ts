import { auth } from "@/auth";
import { getPool } from "@/server/database/connection";
import { ApiError } from "@/server/utils/api-response";
import type { Role } from "@/types";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    throw new ApiError("Authentication required", 401);
  }

  const result = await getPool().query<{
    id: string;
    name: string;
    email: string;
    role: Role;
    status: string;
  }>(
    `SELECT id::text, name, email, role, status
     FROM users WHERE id = $1`,
    [user.id],
  );
  const currentUser = result.rows[0];
  if (!currentUser || currentUser.status !== "active") {
    throw new ApiError("Authentication required", 401);
  }

  return {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role,
  };
}
