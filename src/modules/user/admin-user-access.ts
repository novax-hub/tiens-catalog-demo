import type { AuthSession } from "@/lib/auth";
import type { AdminUserDetail } from "@/modules/user/admin-user.types.ts";

export function canAccessAdminUser(
  session: Pick<AuthSession, "role" | "countryCodes">,
  user: Pick<AdminUserDetail, "role" | "countryCodes">,
): boolean {
  if (session.role === "SUPER_ADMIN") {
    return true;
  }

  if (session.role !== "ADMIN") {
    return false;
  }

  if (user.role !== "EDITOR" && user.role !== "ASSISTANT") {
    return false;
  }

  const allowedSet = new Set(session.countryCodes.map((code) => code.toLowerCase()));
  const currentCountries = user.countryCodes.map((code) => code.toLowerCase());

  if (currentCountries.length === 0) {
    return false;
  }

  return currentCountries.every((code) => allowedSet.has(code));
}