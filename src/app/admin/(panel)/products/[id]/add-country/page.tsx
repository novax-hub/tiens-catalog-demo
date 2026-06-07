import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

import {
  AUTH_SESSION_COOKIE_NAME,
  canManageGlobalProducts,
  readAuthSession,
} from "@/lib/auth";
import { findAdminGlobalProductDetail } from "@/modules/product/admin-product.repository.ts";
import { listCountries, listLanguages } from "@/modules/product/product.repository.ts";
import { AddCountryForm } from "@/components/admin/add-country-form.tsx";

export const dynamic = "force-dynamic";

type AddCountryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AddCountryPage({ params }: AddCountryPageProps) {
  const { id } = await params;

  const cookieStore = await cookies();
  const session = await readAuthSession(cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value);

  if (!session) redirect("/admin/login");
  if (!canManageGlobalProducts(session.role)) redirect("/admin/dashboard");

  if (!id) notFound();

  const [product, countries, languages] = await Promise.all([
    findAdminGlobalProductDetail(id),
    listCountries(),
    listLanguages(),
  ]);

  if (!product) notFound();

  const configuredCountryCodes = product.countries.map((c) => c.countryCode);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div>
        <span className="btn-primary" style={{ padding: "6px 10px", borderRadius: 999, fontSize: "0.75rem" }}>
          Agregar país
        </span>
        <h1 style={{ margin: "8px 0 6px", fontSize: "clamp(1.4rem, 2.5vw, 2rem)", lineHeight: 1.1 }}>
          Agregar país al producto
        </h1>
        <p style={{ margin: 0, maxWidth: "58ch", color: "var(--color-neutral-600)" }}>
          Configura una nueva ficha para el producto en un país adicional. El contenido de texto podrá completarse desde el módulo{" "}
          <strong>Productos por País</strong> una vez creada la configuración.
        </p>
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
        <AddCountryForm
          productId={product.id}
          productSku={product.sku}
          productName={product.name}
          availableCountries={countries}
          availableLanguages={languages}
          configuredCountryCodes={configuredCountryCodes}
        />
      </section>
    </div>
  );
}
