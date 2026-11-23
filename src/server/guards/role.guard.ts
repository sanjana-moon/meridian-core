import { requireUser, type AuthenticatedUser } from "@/server/guards/auth.guard";
import { ApiError } from "@/server/utils/api-response";
import type { Role } from "@/types";

export async function requireRole(...roles: Role[]): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new ApiError("You do not have permission to perform this action", 403);
  }

  return user;
}
