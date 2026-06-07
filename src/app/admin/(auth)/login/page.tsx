import Link from "next/link";
import Image from "next/image";

const errorMessages: Record<string, string> = {
  missing_credentials: "Ingresa correo y contraseña para continuar.",
  invalid_credentials: "Las credenciales no coinciden con ningún usuario activo.",
  inactive_account: "La cuenta está inactiva.",
  forbidden: "Tu sesión no tiene permisos para esa acción.",
};

export default async function AdminLoginPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}>) {
  const resolvedSearchParams = await searchParams;
  const nextPath = typeof resolvedSearchParams?.next === "string" ? resolvedSearchParams.next : "/admin/products";
  const errorKey = typeof resolvedSearchParams?.error === "string" ? resolvedSearchParams.error : "";
  const errorMessage = errorMessages[errorKey] ?? "";

  return (
    <section style={{ width: "min(100%, 480px)", background: "rgba(255, 255, 255, 0.96)", border: "1px solid var(--color-neutral-300)", borderRadius: 24, padding: "var(--space-5)", boxShadow: "0 28px 60px rgba(11, 90, 58, 0.08)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 28, marginBottom: "var(--space-5)" }}>
        <Image
          src="/images/logo.svg"
          alt="Tiens"
          width={140}
          height={140}
          style={{ objectFit: "contain" }}
        />
        <h1 style={{ margin: 0, fontSize: "clamp(1.8rem, 4vw, 2.4rem)", lineHeight: 1.1, fontWeight: 600 }}>Iniciar sesión</h1>
      </div>

      {errorMessage ? (
        <div style={{ marginBottom: "var(--space-4)", padding: "12px 14px", borderRadius: 12, background: "rgba(205, 72, 46, 0.08)", color: "#8c2718", border: "1px solid rgba(205, 72, 46, 0.18)" }}>
          {errorMessage}
        </div>
      ) : null}

      <form action="/api/auth/login" method="post" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <input type="hidden" name="redirectTo" value={nextPath} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-neutral-700)" }} htmlFor="email">Correo</label>
          <input id="email" name="email" type="email" placeholder="admin.pe@local.test" autoComplete="email" style={{ width: "100%", border: "1px solid var(--color-neutral-300)", borderRadius: 12, padding: "12px 14px", font: "inherit", background: "var(--color-white)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-neutral-700)" }} htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" style={{ width: "100%", border: "1px solid var(--color-neutral-300)", borderRadius: 12, padding: "12px 14px", font: "inherit", background: "var(--color-white)" }} />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          <button type="submit" className="btn-primary" style={{ cursor: "pointer", border: "none" }}>Entrar al panel</button>
          <Link href="/pe" className="btn-primary" style={{ background: "var(--color-white)", color: "var(--color-neutral-900)", border: "1px solid var(--color-neutral-300)" }}>Volver al catálogo</Link>
        </div>
      </form>
    </section>
  );
}