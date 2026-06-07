import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  AUTH_SESSION_COOKIE_NAME,
  canEditCountryProduct,
  readAuthSession,
} from "@/lib/auth";
import { listAdminRegionalProducts } from "@/modules/product/admin-product.repository.ts";
import { RegionalConfigurationsFilters } from "@/components/admin/regional-configurations-filters.tsx";

export const dynamic = "force-dynamic";

type RegionalConfigurationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminRegionalConfigurationsPage({
  searchParams,
}: RegionalConfigurationsPageProps) {
  const cookieStore = await cookies();
  const session = await readAuthSession(cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value);

  if (!session) redirect("/admin/login");

  const allowedCountryCodes = session.role === "SUPER_ADMIN" ? null : session.countryCodes;

  const allItems = await listAdminRegionalProducts({ allowedCountryCodes });

  // Derive unique filter options from data
  const countryMap = new Map<string, string>();
  const languageMap = new Map<string, string>();
  for (const item of allItems) {
    countryMap.set(item.countryCode.toLowerCase(), item.countryName);
    languageMap.set(item.languageCode.toLowerCase(), item.languageName);
  }
  const availableCountries = [...countryMap.entries()]
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const availableLanguages = [...languageMap.entries()]
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Read and apply filters from URL search params
  const sp = await searchParams;
  const filterCountry = typeof sp.country === "string" ? sp.country.toLowerCase() : "";
  const filterLanguage = typeof sp.language === "string" ? sp.language.toLowerCase() : "";
  const filterStatus = typeof sp.status === "string" ? sp.status : "";
  const filterQ = typeof sp.q === "string" ? sp.q.toLowerCase().trim() : "";

  const filtered = allItems.filter((item) => {
    if (filterCountry && item.countryCode.toLowerCase() !== filterCountry) return false;
    if (filterLanguage && item.languageCode.toLowerCase() !== filterLanguage) return false;
    if (filterStatus === "active" && !item.isRegionallyActive) return false;
    if (filterStatus === "inactive" && item.isRegionallyActive) return false;
    if (filterQ) {
      const haystack = `${item.productSku} ${item.name ?? ""}`.toLowerCase();
      if (!haystack.includes(filterQ)) return false;
    }
    return true;
  });

  const activeCount = filtered.filter((i) => i.isRegionallyActive).length;
  const inactiveCount = filtered.length - activeCount;

  const canEdit = canEditCountryProduct(session.role);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: "8px 0 6px", fontSize: "clamp(1.6rem, 3vw, 2.3rem)", lineHeight: 1.1 }}>
          Productos por País
        </h1>
        {/* <p style={{ margin: 0, maxWidth: "58ch", color: "var(--color-neutral-600)" }}>
          Vista de trabajo diario. Cada fila representa la configuración de un producto en un país
          e idioma específico.
          {session.role !== "SUPER_ADMIN" && session.countryCodes.length > 0 && (
            <>
              {" "}
              Mostrando solo países asignados:{" "}
              <strong>{session.countryCodes.map((c) => c.toUpperCase()).join(", ")}</strong>.
            </>
          )}
        </p> */}
        {session.role === "ADMIN" && (
          <Link
            href="/admin/regional-configurations/new"
            className="btn-primary"
            style={{ display: "inline-block", marginTop: "var(--space-2)", padding: "10px 20px", borderRadius: 10, fontSize: "0.9rem" }}
          >
            + Nueva configuración
          </Link>
        )}
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
            { label: "Configuraciones", value: filtered.length, icon: "🗂", color: "#2b8a3e" },
            { label: "Activas", value: activeCount, icon: "✅", color: "#1f9bff" },
            { label: "Inactivas", value: inactiveCount, icon: "⚠️", color: "#ff6b6b" },
          ].map(({ label, value, icon, color }) => (
            <article key={label} style={{ gridColumn: "span 4", background: "var(--color-white)", border: "1px solid var(--color-neutral-300)", borderRadius: 18, padding: "var(--space-4)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18 }}>{icon}</div>
                  <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>{label}</h2>
                </div>
                <span className="btn-primary" style={{ padding: "6px 10px", borderRadius: 999, fontSize: "0.75rem" }}>{value}</span>
              </div>
              <p style={{ margin: 0, color: "var(--color-neutral-600)" }}>Resumen del estado.</p>
            </article>
          ))}
        </div>
      </section>

      {/* Table section */}
      <section
        style={{
          background: "rgba(255,255,255,0.92)",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: 20,
          padding: "var(--space-4)",
          boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>Listado</h2>
            <p style={{ margin: 0, color: "var(--color-neutral-600)" }}>
              Cada fila es una ficha de producto por país e idioma. Haz clic en{" "}
              <strong>Ver detalle</strong> para acceder a la vista completa.
            </p>
          </div>
          {/* badge de permiso oculto por requerimiento */}
        </div>

        {/* Filters */}
        <div style={{ marginBottom: "var(--space-3)" }}>
          <RegionalConfigurationsFilters
            countries={availableCountries}
            languages={availableLanguages}
          />
        </div>

        {filtered.length === 0 ? (
          <p style={{ color: "var(--color-neutral-500)", padding: "var(--space-4) 0" }}>
            No se encontraron configuraciones que coincidan con los filtros aplicados.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["SKU", "Nombre", "País", "Idioma", "Slug", "Estado regional", "Acciones"].map(
                    (header) => (
                      <th
                        key={header}
                        style={{
                          padding: "14px 12px",
                          borderBottom: "1px solid var(--color-neutral-300)",
                          textAlign: "left",
                          color: "var(--color-neutral-600)",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={`${item.productCountryId}-${item.languageCode}`}>
                    <td
                      style={{
                        padding: "14px 12px",
                        borderBottom: "1px solid var(--color-neutral-300)",
                        verticalAlign: "top",
                        fontFamily: "monospace",
                        fontSize: "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.productSku}
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        borderBottom: "1px solid var(--color-neutral-300)",
                        verticalAlign: "top",
                        maxWidth: 200,
                      }}
                    >
                      {item.name ?? (
                        <span style={{ color: "var(--color-neutral-400)" }}>Sin nombre</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        borderBottom: "1px solid var(--color-neutral-300)",
                        verticalAlign: "top",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        className="btn-primary"
                        style={{ padding: "4px 8px", borderRadius: 999, fontSize: "0.75rem" }}
                      >
                        {item.countryCode.toUpperCase()}
                      </span>
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: "0.8rem",
                          color: "var(--color-neutral-600)",
                        }}
                      >
                        {item.countryName}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        borderBottom: "1px solid var(--color-neutral-300)",
                        verticalAlign: "top",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ fontSize: "0.875rem" }}>
                        {item.languageName}{" "}
                        <span style={{ color: "var(--color-neutral-400)", fontSize: "0.75rem" }}>
                          ({item.languageCode.toUpperCase()})
                        </span>
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        borderBottom: "1px solid var(--color-neutral-300)",
                        verticalAlign: "top",
                        fontFamily: "monospace",
                        fontSize: "0.8rem",
                        maxWidth: 160,
                        wordBreak: "break-all",
                      }}
                    >
                      {item.slug}
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        borderBottom: "1px solid var(--color-neutral-300)",
                        verticalAlign: "top",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        className="btn-primary"
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontSize: "0.75rem",
                          opacity: item.isRegionallyActive ? 1 : 0.45,
                        }}
                      >
                        {item.isRegionallyActive ? "Activo" : "Inactivo"}
                      </span>
                      {!item.isGloballyActive && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: "0.7rem",
                            color: "var(--color-neutral-500)",
                          }}
                        >
                          (global inactivo)
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        borderBottom: "1px solid var(--color-neutral-300)",
                        verticalAlign: "top",
                        whiteSpace: "nowrap",
                      }}
                    >
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <Link href={`/admin/regional-configurations/${item.productCountryId}`} title="Ver detalle" aria-label="Ver detalle" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid var(--color-neutral-300)" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </Link>
                          {canEdit && (
                            <Link href={`/admin/regional-configurations/${item.productCountryId}/edit`} title="Editar" aria-label="Editar" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid var(--color-neutral-300)" }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </Link>
                          )}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
