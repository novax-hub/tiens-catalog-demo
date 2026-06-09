import { cookies } from "next/headers";
import Link from "next/link";

import { AUTH_SESSION_COOKIE_NAME, readAuthSession } from "@/lib/auth";
import { getAdminNavItems } from "@/modules/admin/admin-navigation.ts";
import { logoutAction } from "@/actions/auth-actions";

type AdminPanelShellProps = {
  children: React.ReactNode;
};

export async function AdminPanelShell({ children }: AdminPanelShellProps) {
  const year = new Date().getFullYear();
  const cookieStore = await cookies();
  const session = await readAuthSession(cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value);

  const navItems = getAdminNavItems(session?.role);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "300px minmax(0, 1fr)",
        background:
          "radial-gradient(circle at top left, rgba(31, 163, 106, 0.08), transparent 32%), linear-gradient(180deg, #f4fbf7 0%, var(--color-neutral-100) 100%)",
      }}
    >
      <aside
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          padding: "var(--space-4)",
          background: "rgba(255, 255, 255, 0.92)",
          borderRight: "1px solid var(--color-neutral-300)",
          backdropFilter: "blur(18px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            paddingBottom: "var(--space-4)",
            marginBottom: "var(--space-4)",
            borderBottom: "1px solid var(--color-neutral-300)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))",
              color: "var(--color-white)",
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}
          >
            TC
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <strong style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}>Tiens Admin</strong>
            <span style={{ fontSize: "0.875rem", color: "var(--color-neutral-600)" }}>
              {session ? `${session.role} · ${session.email}` : "Fase 2 · Mantenedor"}
            </span>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }} aria-label="Navegación principal del admin">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--space-2)",
                padding: "12px 14px",
                borderRadius: 12,
                color: "var(--color-neutral-700)",
                fontWeight: 600,
              }}
            >
              <span>{item.label}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>{item.meta}</span>
            </Link>
          ))}
        </nav>

        <div
          style={{
            marginTop: "auto",
            paddingTop: "var(--space-4)",
            borderTop: "1px solid var(--color-neutral-300)",
            color: "var(--color-neutral-600)",
            fontSize: "0.875rem",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div>Guía visual basada en el frontend actual.</div>

          <form action={logoutAction}>
            <button
              type="submit"
              style={{
                marginTop: "4px",
                padding: "8px 12px",
                borderRadius: 8,
                background: "transparent",
                border: "1px solid var(--color-neutral-300)",
                color: "var(--color-neutral-700)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cerrar sesión
            </button>
          </form>

          <div>© {year} Tiens Catalog</div>
        </div>
      </aside>

      <main style={{ padding: "var(--space-4)" }}>{children}</main>
    </div>
  );
}