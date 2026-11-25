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

// Simple in-process TTL cache so we don't hit the DB on every single
// authenticated request. 15 s is short enough that a "blocked" user is
// cut off almost immediately, but saves most DB round-trips.
interface CacheEntry {
  user: AuthenticatedUser;
  expiresAt: number;
}
const USER_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15_000;

function cacheGet(id: string): AuthenticatedUser | null {
  const entry = USER_CACHE.get(id);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    USER_CACHE.delete(id);
    return null;
  }
  return entry.user;
}

function cacheSet(id: string, user: AuthenticatedUser) {
  USER_CACHE.set(id, { user, expiresAt: Date.now() + CACHE_TTL_MS });
  // Prevent unbounded growth in long-lived processes
  if (USER_CACHE.size > 5000) {
    const now = Date.now();
    for (const [k, v] of USER_CACHE) {
      if (v.expiresAt < now) USER_CACHE.delete(k);
    }
  }
}

export function invalidateUserCache(id: string) {
  USER_CACHE.delete(id);
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    throw new ApiError("Authentication required", 401);
  }

  const cached = cacheGet(user.id);
  if (cached) return cached;

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

  const authenticated: AuthenticatedUser = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role,
  };
  cacheSet(authenticated.id, authenticated);
  return authenticated;
}