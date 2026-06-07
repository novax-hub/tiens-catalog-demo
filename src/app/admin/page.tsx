import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_SESSION_COOKIE_NAME, readAuthSession } from "@/lib/auth";
import { getAdminLandingPath } from "@/modules/admin/admin-navigation.ts";

/**
 * Admin root landing — redirects to the role-appropriate module.
 *
 * SUPER_ADMIN → /admin/dashboard (and then to Productos, etc.)
 * ADMIN       → /admin/dashboard
 * EDITOR      → /admin/regional-configurations
 * ASSISTANT   → /admin/regional-configurations
 */
export default async function AdminRootPage() {
  const cookieStore = await cookies();
  const session = await readAuthSession(cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value);

  if (!session) {
    redirect("/admin/login");
  }

  redirect(getAdminLandingPath(session.role));
}