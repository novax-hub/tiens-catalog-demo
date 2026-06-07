import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AUTH_SESSION_COOKIE_NAME, canManageUsers, readAuthSession } from "@/lib/auth";
import { listCountries } from "@/modules/product/product.repository.ts";
import { listAdminUsers } from "@/modules/user/admin-user.repository.ts";
import { UserManagementPanel } from "@/components/admin/user-management-panel.tsx";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const cookieStore = await cookies();
  const session = await readAuthSession(cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value);

  if (!session) {
    redirect("/admin/login");
  }

  if (!canManageUsers(session.role)) {
    redirect("/admin/dashboard");
  }

  const allowedCountryCodes = session.role === "SUPER_ADMIN" ? null : session.countryCodes;

  const [users, countries] = await Promise.all([
    listAdminUsers({ allowedCountryCodes }),
    listCountries(),
  ]);

  const visibleCountries =
    session.role === "SUPER_ADMIN"
      ? countries.map((country) => ({ code: country.code, name: country.name }))
      : countries
          .filter((country) => session.countryCodes.some((code) => code.toLowerCase() === country.code.toLowerCase()))
          .map((country) => ({ code: country.code, name: country.name }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div>
        <h1 style={{ margin: "8px 0 6px", fontSize: "clamp(1.6rem, 3vw, 2.3rem)", lineHeight: 1.1 }}>
          Usuarios
        </h1>
        <p style={{ margin: 0, maxWidth: "58ch", color: "var(--color-neutral-600)" }}>
          Administración de usuarios con alcance por rol y país.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Link href="/admin/users/new" className="btn-primary" style={{ textDecoration: "none" }}>
          Nuevo usuario
        </Link>
      </div>

      <UserManagementPanel
        availableCountries={visibleCountries}
        users={users}
      />
    </div>
  );
}
