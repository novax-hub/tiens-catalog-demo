import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { AUTH_SESSION_COOKIE_NAME, readAuthSession } from "@/lib/auth";
import { listCountries, listLanguages } from "@/modules/product/product.repository.ts";
import { listActiveProductsWithoutCountry } from "@/modules/product/admin-product.repository.ts";
import { NewRegionalConfigForm } from "@/components/admin/new-regional-config-form.tsx";

export const dynamic = "force-dynamic";

export default async function AdminNewRegionalConfigPage() {
  const cookieStore = await cookies();
  const session = await readAuthSession(cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value);

  if (!session) redirect("/admin/login");

  // SUPER_ADMIN uses the product detail → Agregar País flow instead
  if (session.role === "SUPER_ADMIN") {
    redirect("/admin/products");
  }

  // Only ADMIN role reaches here
  if (session.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  // ADMIN must have exactly one country code assigned
  const adminCountryCode = session.countryCodes[0];
  if (!adminCountryCode) redirect("/admin/dashboard");

  const [allCountries, languages, availableProducts] = await Promise.all([
    listCountries(),
    listLanguages(),
    listActiveProductsWithoutCountry(adminCountryCode),
  ]);

  const country = allCountries.find(
    (c) => c.code.toLowerCase() === adminCountryCode.toLowerCase(),
  );

  const countryName = country?.name ?? adminCountryCode.toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div>
        <span className="btn-primary" style={{ padding: "6px 10px", borderRadius: 999, fontSize: "0.75rem" }}>
          Nueva configuración
        </span>
        <h1 style={{ margin: "8px 0 6px", fontSize: "clamp(1.4rem, 2.5vw, 2rem)", lineHeight: 1.1 }}>
          Nueva configuración regional
        </h1>
        <p style={{ margin: 0, maxWidth: "58ch", color: "var(--color-neutral-600)" }}>
          Crea una ficha de producto para {countryName}. Selecciona un producto activo que aún no tenga
          configuración en tu país.
        </p>
        <Link
          href="/admin/regional-configurations"
          style={{
            display: "inline-block",
            marginTop: "var(--space-2)",
            fontSize: "0.875rem",
            color: "var(--color-neutral-500)",
          }}
        >
          ← Volver a Productos por País
        </Link>
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
        <NewRegionalConfigForm
          availableProducts={availableProducts}
          countryCode={adminCountryCode}
          countryName={countryName}
          availableLanguages={languages}
        />
      </section>
    </div>
  );
}

