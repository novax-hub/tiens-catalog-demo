import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AUTH_SESSION_COOKIE_NAME, canManageUsers, readAuthSession } from "@/lib/auth";
import { listCountries } from "@/modules/product/product.repository.ts";
import { UserCreateForm } from "@/components/admin/user-create-form.tsx";

export const dynamic = "force-dynamic";

export default async function NewAdminUserPage() {
  const cookieStore = await cookies();
  const session = await readAuthSession(cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value);

  if (!session) {
    redirect("/admin/login");
  }

  if (!canManageUsers(session.role)) {
    redirect("/admin/dashboard");
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
            Nuevo usuario
          </h1>
          <p style={{ margin: 0, maxWidth: "58ch", color: "var(--color-neutral-600)" }}>
            Crea un usuario dentro de tu alcance de rol y países.
          </p>
        </div>

        <Link href="/admin/users" className="btn-primary" style={{ textDecoration: "none", background: "var(--color-white)", color: "var(--color-neutral-900)", border: "1px solid var(--color-neutral-300)" }}>
          Volver al listado
        </Link>
      </div>

      <UserCreateForm currentRole={session.role} availableCountries={visibleCountries} />
    </div>
  );
}
