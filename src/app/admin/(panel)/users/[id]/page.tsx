import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AUTH_SESSION_COOKIE_NAME, canManageUsers, readAuthSession } from "@/lib/auth";
import { canAccessAdminUser } from "@/modules/user/admin-user-access.ts";
import { findAdminUserById } from "@/modules/user/admin-user.repository.ts";

export const dynamic = "force-dynamic";

function formatCountries(countryCodes: string[]) {
  if (countryCodes.length === 0) return "Global";
  return countryCodes.map((code) => code.toUpperCase()).join(", ");
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "8px 0 6px", fontSize: "clamp(1.6rem, 3vw, 2.3rem)", lineHeight: 1.1 }}>
            Detalle de usuario
          </h1>
          <p style={{ margin: 0, maxWidth: "58ch", color: "var(--color-neutral-600)" }}>
            Vista detallada del usuario dentro de tu alcance actual.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/admin/users" title="Volver al listado" aria-label="Volver al listado" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid var(--color-neutral-300)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link href={`/admin/users/${user.id}/edit`} title="Editar usuario" aria-label="Editar usuario" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid var(--color-neutral-300)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>

      <section
        style={{
          background: "rgba(255,255,255,0.92)",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: 20,
          padding: "var(--space-4)",
          boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)",
        }}
      >
        <div style={{ display: "grid", gap: "var(--space-3)", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          <div><strong>Nombre:</strong> {user.name}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Rol:</strong> {user.role}</div>
          <div><strong>Estado:</strong> {user.isActive ? "Activo" : "Inactivo"}</div>
          <div><strong>Países:</strong> {formatCountries(user.countryCodes)}</div>
          <div><strong>Creado:</strong> {formatDate(user.createdAt)}</div>
          <div><strong>Último acceso:</strong> {formatDate(user.lastLoginAt)}</div>
        </div>
      </section>
    </div>
  );
}