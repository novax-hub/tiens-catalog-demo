import Link from "next/link";
import { notFound } from "next/navigation";
import { findAdminGlobalProductDetail } from "@/modules/product/admin-product.repository.ts";
import { GlobalProductToggle } from "@/components/admin/global-product-toggle.tsx";

export const dynamic = "force-dynamic";

type AdminProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProductDetailPage({ params }: AdminProductDetailPageProps) {
  const { id } = await params;

  if (!id) notFound();

  const product = await findAdminGlobalProductDetail(id);

  if (!product) notFound();

  const totalLanguages = product.countries.reduce((acc, c) => acc + c.languages.length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <div>
          <h1 style={{ margin: "8px 0 2px", fontSize: "clamp(1.6rem, 3vw, 2.3rem)", lineHeight: 1.1 }}>
            {product.name || product.sku}
          </h1>
          <p style={{ margin: "0 0 6px", fontFamily: "monospace", fontSize: "0.875rem", color: "var(--color-neutral-500)" }}>
            SKU: {product.sku}
          </p>
          <p style={{ margin: 0, maxWidth: "58ch", color: "var(--color-neutral-600)" }}>
            Vista global del producto. Aquí se muestra la configuración de todos los países e idiomas. Para editar el contenido de un país específico, accede al módulo{" "}
            <strong>Productos por País</strong>.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "flex-start" }}>
          <Link
            href="/admin/products"
            className="btn-primary"
            style={{
              background: "var(--color-white)",
              color: "var(--color-neutral-900)",
              border: "1px solid var(--color-neutral-300)",
            }}
          >
            Volver al listado
          </Link>
          {/* PR 5 — Agregar país (stub) */}
          <Link
            href={`/admin/products/${product.id}/add-country`}
            className="btn-primary"
          >
            Agregar país
          </Link>
          <GlobalProductToggle productId={product.id} isActive={product.isActive} />
        </div>
      </div>

      {/* Estado actual (cards) */}
      <section
        style={{
          background: "rgba(255,255,255,0.92)",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: 20,
          padding: "var(--space-4)",
          boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "0.95rem", color: "var(--color-neutral-700)", fontWeight: 600 }}>Estado actual</h3>
        <div style={{ height: 12 }} />
        <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}>
          {[
            { label: "Estado global", value: product.isActive ? "Activo" : "Inactivo", icon: "✅", color: "#1f9bff" },
            { label: "Países configurados", value: product.countries.length, icon: "🌍", color: "#2b8a3e" },
            { label: "Idiomas totales", value: totalLanguages, icon: "📝", color: "#ff9f1c" },
          ].map(({ label, value, icon, color }) => (
            <article key={label} style={{ gridColumn: "span 4", background: "var(--color-white)", border: "1px solid var(--color-neutral-300)", borderRadius: 18, padding: "var(--space-4)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18 }}>{icon}</div>
                  <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>{label}</h2>
                </div>
                <span className="btn-primary" style={{ padding: "6px 10px", borderRadius: 999, fontSize: "0.75rem", opacity: 1 }}>{value}</span>
              </div>
              <p style={{ margin: 0, color: "var(--color-neutral-600)" }}>Resumen rápido del indicador.</p>
            </article>
          ))}
        </div>
      </section>

      {/* Countries + languages */}
      <section
        style={{
          background: "rgba(255,255,255,0.92)",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: 20,
          padding: "var(--space-4)",
          boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1rem" }}>Configuraciones por país</h2>
            <p style={{ margin: 0, color: "var(--color-neutral-600)" }}>
              Para cada país se muestran los idiomas configurados y el estado regional.
            </p>
          </div>
        </div>

        {product.countries.length === 0 ? (
          <div style={{ padding: "var(--space-4)", textAlign: "center", color: "var(--color-neutral-500)" }}>
            Este producto aún no tiene configuración para ningún país.{" "}
            <Link href={`/admin/products/${product.id}/add-country`} className="btn-primary" style={{ padding: "8px 14px", fontSize: "0.875rem" }}>
              Agregar primer país
            </Link>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["País", "Slug", "Precio", "Estado regional", "Idiomas", "Acciones"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px 12px",
                      borderBottom: "1px solid var(--color-neutral-300)",
                      textAlign: "left",
                      color: "var(--color-neutral-600)",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {product.countries.map((country) => (
                <tr key={country.countryCode}>
                  <td style={{ padding: "14px 12px", borderBottom: "1px solid var(--color-neutral-300)", verticalAlign: "top" }}>
                    <span
                      className="btn-primary"
                      style={{ padding: "4px 10px", borderRadius: 999, fontSize: "0.8rem", opacity: country.isActive ? 1 : 0.5 }}
                    >
                      {country.countryCode.toUpperCase()}
                    </span>
                    <div style={{ marginTop: 4, fontSize: "0.8rem", color: "var(--color-neutral-500)" }}>{country.countryName}</div>
                  </td>
                  <td style={{ padding: "14px 12px", borderBottom: "1px solid var(--color-neutral-300)", verticalAlign: "top", fontFamily: "monospace", fontSize: "0.875rem" }}>
                    {country.slug}
                  </td>
                  <td style={{ padding: "14px 12px", borderBottom: "1px solid var(--color-neutral-300)", verticalAlign: "top", fontSize: "0.875rem" }}>
                    {country.price.toLocaleString("es-PE", { style: "currency", currency: country.currency, minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: "14px 12px", borderBottom: "1px solid var(--color-neutral-300)", verticalAlign: "top" }}>
                    <span
                      className="btn-primary"
                      style={{ padding: "4px 10px", borderRadius: 999, fontSize: "0.75rem", opacity: country.isActive ? 1 : 0.45 }}
                    >
                      {country.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 12px", borderBottom: "1px solid var(--color-neutral-300)", verticalAlign: "top" }}>
                    {country.languages.length === 0 ? (
                      <span style={{ color: "var(--color-neutral-400)", fontSize: "0.8rem" }}>Sin traducción</span>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {country.languages.map((lang) => (
                          <span
                            key={lang.languageCode}
                            title={lang.name ?? undefined}
                            style={{
                              padding: "3px 8px",
                              borderRadius: 999,
                              fontSize: "0.75rem",
                              background: "var(--color-neutral-100)",
                              border: "1px solid var(--color-neutral-300)",
                              color: "var(--color-neutral-700)",
                              fontWeight: 600,
                            }}
                          >
                            {lang.languageCode.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "14px 12px", borderBottom: "1px solid var(--color-neutral-300)", verticalAlign: "top" }}>
                    {/* PR 6 — detalle regional (stub) */}
                    <Link href={`/admin/regional-configurations`} title="Ver por País" aria-label="Ver por País" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid var(--color-neutral-300)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}