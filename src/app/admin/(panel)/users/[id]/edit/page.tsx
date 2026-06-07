import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AUTH_SESSION_COOKIE_NAME, canManageUsers, readAuthSession } from "@/lib/auth";
import { UserEditForm } from "@/components/admin/user-edit-form.tsx";
import { listCountries } from "@/modules/product/product.repository.ts";
import { canAccessAdminUser } from "@/modules/user/admin-user-access.ts";
import { findAdminUserById } from "@/modules/user/admin-user.repository.ts";

export const dynamic = "force-dynamic";

export default async function AdminUserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const session = await readAuthSession(cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value);

  if (!session) {
    redirect("/admin/login");
  }

  if (!canManageUsers(session.role)) {
    redirect("/admin/dashboard");
  }

  const { id } = await params;
  const user = await findAdminUserById(id);

  if (!user || !canAccessAdminUser(session, user)) {
    redirect("/admin/users");
  }

  const countries = await listCountries();
  const visibleCountries =
    session.role === "SUPER_ADMIN"
      ? countries.map((country) => ({ code: country.code, name: country.name }))
      : countries
          .filter((country) => session.countryCodes.some((code) => code.toLowerCase() === country.code.toLowerCase()))
          .map((country) => ({ code: country.code, name: country.name }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "8px 0 6px", fontSize: "clamp(1.6rem, 3vw, 2.3rem)", lineHeight: 1.1 }}>
            Editar usuario
          </h1>
          <p style={{ margin: 0, maxWidth: "58ch", color: "var(--color-neutral-600)" }}>
            Actualiza el usuario sin salir del flujo principal de administración.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/admin/users" title="Volver al listado" aria-label="Volver al listado" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid var(--color-neutral-300)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link href={`/admin/users/${user.id}`} title="Ver usuario" aria-label="Ver usuario" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid var(--color-neutral-300)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>

      <UserEditForm currentRole={session.role} availableCountries={visibleCountries} user={user} />
    </div>
  );
}