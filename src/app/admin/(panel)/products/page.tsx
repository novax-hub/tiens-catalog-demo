import Link from "next/link";
import { listAdminGlobalProducts } from "@/modules/product/admin-product.repository.ts";
import { GlobalProductToggle } from "@/components/admin/global-product-toggle.tsx";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listAdminGlobalProducts();

  const activeCount = products.filter((p) => p.isActive).length;
  const withCountriesCount = products.filter((p) => p.countries.length > 0).length;

  const cards = [
    { label: "Total de productos", value: products.length, color: "#2b8a3e", icon: "📦" },
    { label: "Activos globalmente", value: activeCount, color: "#1f9bff", icon: "✅" },
    { label: "Con configuración país", value: withCountriesCount, color: "#ff9f1c", icon: "🌍" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <div>
          <h1 style={{ margin: "8px 0 6px", fontSize: "clamp(1.6rem, 3vw, 2.3rem)", lineHeight: 1.1 }}>Productos</h1>
          <p style={{ margin: 0, maxWidth: "58ch", color: "var(--color-neutral-600)" }}>Vista global del catálogo. Cada producto puede tener configuraciones para uno o más países.</p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          <Link href="/admin/products/new" className="btn-primary">
            Nuevo producto
          </Link>
          <Link href="/pe" className="btn-primary" style={{ background: "var(--color-white)", color: "var(--color-neutral-900)", border: "1px solid var(--color-neutral-300)" }}>
            Ver catálogo
          </Link>
        </div>
      </div>

      <section style={{ background: "rgba(255,255,255,0.92)", border: "1px solid var(--color-neutral-300)", borderRadius: 20, padding: "var(--space-4)", boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)" }}>
        <h3 style={{ margin: 0, fontSize: "0.95rem", color: "var(--color-neutral-700)", fontWeight: 600 }}>Estado actual</h3>
        <div style={{ height: 12 }} />
        <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}>
          {cards.map(({ label, value, icon, color }) => (
            <article key={label} style={{ gridColumn: "span 4", background: "var(--color-white)", border: "1px solid var(--color-neutral-300)", borderRadius: 18, padding: "var(--space-4)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18 }}>{icon}</div>
                  <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>{label}</h2>
                </div>
                <span className="btn-primary" style={{ padding: "6px 10px", borderRadius: 999, fontSize: "0.75rem" }}>{value}</span>
              </div>
              <p style={{ margin: 0, color: "var(--color-neutral-600)" }}>Resumen rápido del indicador.</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ background: "rgba(255,255,255,0.92)", border: "1px solid var(--color-neutral-300)", borderRadius: 20, padding: "var(--space-4)", boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>Catálogo global</h2>
            <p style={{ margin: 0, color: "var(--color-neutral-600)" }}>Cada fila representa un producto global con sus países configurados.</p>
          </div>
          {/* badge de permiso oculto por requerimiento */}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["SKU", "Nombre", "Países", "Estado global", "Acciones"].map((header) => (
                <th key={header} style={{ padding: "14px 12px", borderBottom: "1px solid var(--color-neutral-300)", textAlign: "left", color: "var(--color-neutral-600)", fontSize: "0.875rem", fontWeight: 600 }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td style={{ padding: "14px 12px", borderBottom: "1px solid var(--color-neutral-300)", verticalAlign: "top", fontFamily: "monospace", fontSize: "0.875rem" }}>{product.sku}</td>
                <td style={{ padding: "14px 12px", borderBottom: "1px solid var(--color-neutral-300)", verticalAlign: "top" }}>
                  {product.name || <span style={{ color: "var(--color-neutral-400)" }}>Sin nombre</span>}
                </td>
                <td style={{ padding: "14px 12px", borderBottom: "1px solid var(--color-neutral-300)", verticalAlign: "top" }}>
                  {product.countries.length === 0 ? (
                    <span style={{ color: "var(--color-neutral-400)", fontSize: "0.875rem" }}>Sin configurar</span>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {product.countries.map((c) => (
                        <span key={c.countryCode} className="btn-primary" style={{ padding: "4px 8px", borderRadius: 999, fontSize: "0.75rem", opacity: c.isActive ? 1 : 0.45 }}>
                          {c.countryCode.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ padding: "14px 12px", borderBottom: "1px solid var(--color-neutral-300)", verticalAlign: "top" }}>
                  <span className="btn-primary" style={{ padding: "6px 10px", borderRadius: 999, fontSize: "0.75rem", opacity: product.isActive ? 1 : 0.45 }}>
                    {product.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td style={{ padding: "14px 12px", borderBottom: "1px solid var(--color-neutral-300)", verticalAlign: "top" }}>
                  <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                    <Link href={`/admin/products/${product.id}`} title="Ver detalle" aria-label="Ver detalle" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid var(--color-neutral-300)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                    <GlobalProductToggle productId={product.id} isActive={product.isActive} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}