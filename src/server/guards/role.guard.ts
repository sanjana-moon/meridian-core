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

/**
 * Helper for "user must be one of these roles OR be the owner of the resource".
 * Used in service layers where ownership checks live.
 */
export function assertOwnerOrRole(
  actor: AuthenticatedUser,
  ownerId: string,
  ...allowedRoles: Role[]
): void {
  if (actor.id === ownerId) return;
  if (allowedRoles.includes(actor.role)) return;
  throw new ApiError("You do not have permission to access this resource", 403);
}