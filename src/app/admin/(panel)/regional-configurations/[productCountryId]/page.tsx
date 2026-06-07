import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

import {
  AUTH_SESSION_COOKIE_NAME,
  canEditCountryProduct,
  canToggleCountryProductActivation,
  hasCountryAccess,
  readAuthSession,
} from "@/lib/auth";
import { findAdminRegionalProductDetail } from "@/modules/product/admin-product.repository.ts";

export const dynamic = "force-dynamic";

type RegionalProductDetailPageProps = {
  params: Promise<{ productCountryId: string }>;
};

const TECH_INFO_LABELS: Record<string, string> = {
  "tipo-de-producto":         "Tipo de producto",
  "marca":                    "Marca",
  "ingrediente-principal":    "Ingrediente principal",
  "ingredientes-principales": "Ingredientes principales",
  "componentes-principales":  "Componentes principales",
  "presentacion":             "Presentación",
  "contenido":                "Contenido",
  "diferencial":              "Valor diferencial",
  "tecnologia":               "Tecnología",
  "reconocimientos":          "Reconocimientos",
  "certificaciones":          "Certificaciones",
};

function TechInfoBlock({ value }: { value: unknown }) {
  const isEmpty = !value || typeof value !== "object" || Array.isArray(value);
  if (isEmpty) return null;

  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && String(v).trim() !== ""
  );
  if (entries.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-2) var(--space-3)",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      }}
    >
      {entries.map(([key, val]) => (
        <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--color-neutral-500)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {TECH_INFO_LABELS[key] ?? key}
          </span>
          <span style={{ fontSize: "0.9rem", color: "var(--color-neutral-900)", whiteSpace: "pre-wrap" }}>
            {String(val)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Render a JSON-ish value as a readable string for the detail view. */
function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value || "—";
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value
      .map((item) => (typeof item === "object" && item !== null ? JSON.stringify(item) : String(item)))
      .join("\n");
  }
  return JSON.stringify(value, null, 2);
}

function ReadonlyField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: unknown;
  mono?: boolean;
}) {
  const text = renderValue(value);
  const isEmpty = text === "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--color-neutral-500)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "0.9rem",
          color: isEmpty ? "var(--color-neutral-400)" : "var(--color-neutral-900)",
          fontFamily: mono ? "monospace" : undefined,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {text}
      </span>
    </div>
  );
}

export default async function RegionalProductDetailPage({
  params,
}: RegionalProductDetailPageProps) {
  const { productCountryId } = await params;

  const cookieStore = await cookies();
  const session = await readAuthSession(cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value);

  if (!session) redirect("/admin/login");

  if (!productCountryId) notFound();

  const detail = await findAdminRegionalProductDetail(productCountryId);

  if (!detail) notFound();

  // Enforce country access for non-SUPER_ADMIN roles
  if (!hasCountryAccess(session, detail.countryCode)) {
    redirect("/admin/regional-configurations");
  }

  const canEdit = canEditCountryProduct(session.role);
  const canToggle = canToggleCountryProductActivation(session.role);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--space-3)",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: "8px 0 6px",
              fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
              lineHeight: 1.1,
              fontFamily: "monospace",
            }}
          >
            {detail.productSku}
          </h1>
          <p style={{ margin: 0, maxWidth: "58ch", color: "var(--color-neutral-600)" }}>
            Vista de solo lectura de la configuración regional. El producto tiene{" "}
            <strong>{detail.translations.length}</strong>{" "}
            {detail.translations.length === 1 ? "traducción" : "traducciones"} configuradas.
            {!canEdit && (
              <span style={{ color: "var(--color-neutral-500)" }}>
                {" "}
                Tu rol (<strong>{session.role}</strong>) no permite editar.
              </span>
            )}
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "flex-start" }}>
          <Link
            href="/admin/regional-configurations"
            className="btn-primary"
            style={{
              background: "var(--color-white)",
              color: "var(--color-neutral-900)",
              border: "1px solid var(--color-neutral-300)",
            }}
          >
            Volver al listado
          </Link>
          {canEdit && (
            <Link
              href={`/admin/regional-configurations/${detail.productCountryId}/edit`}
              className="btn-primary"
            >
              Editar
            </Link>
          )}
        </div>
      </div>

      {/* Status cards */}
      <section
        style={{
          background: "rgba(255,255,255,0.92)",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: 20,
          padding: "var(--space-4)",
          boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: "var(--space-4)",
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          }}
        >
          {/* Regional status */}
          <article
            style={{
              gridColumn: "span 4",
              background: "var(--color-white)",
              border: "1px solid var(--color-neutral-300)",
              borderRadius: 18,
              padding: "var(--space-4)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "var(--space-2)",
                marginBottom: "var(--space-3)",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1rem" }}>Estado regional</h2>
              <span
                className="btn-primary"
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  fontSize: "0.75rem",
                  opacity: detail.isRegionallyActive ? 1 : 0.45,
                }}
              >
                {detail.isRegionallyActive ? "Activo" : "Inactivo"}
              </span>
            </div>
            <p style={{ margin: 0, color: "var(--color-neutral-600)" }}>
              Controla si la ficha de este país aparece en el catálogo. Independiente del estado
              global.
              {canToggle ? " Se puede cambiar desde el editor." : " Solo ADMIN y SUPER_ADMIN pueden cambiarlo."}
            </p>
          </article>

          {/* Global status */}
          <article
            style={{
              gridColumn: "span 4",
              background: "var(--color-white)",
              border: "1px solid var(--color-neutral-300)",
              borderRadius: 18,
              padding: "var(--space-4)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "var(--space-2)",
                marginBottom: "var(--space-3)",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1rem" }}>Estado global</h2>
              <span
                className="btn-primary"
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  fontSize: "0.75rem",
                  opacity: detail.isGloballyActive ? 1 : 0.45,
                }}
              >
                {detail.isGloballyActive ? "Activo" : "Inactivo"}
              </span>
            </div>
            <p style={{ margin: 0, color: "var(--color-neutral-600)" }}>
              Estado global del producto padre. Si está inactivo, este país tampoco es visible
              aunque su estado regional sea activo.
            </p>
          </article>

          {/* Translations count */}
          <article
            style={{
              gridColumn: "span 4",
              background: "var(--color-white)",
              border: "1px solid var(--color-neutral-300)",
              borderRadius: 18,
              padding: "var(--space-4)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "var(--space-2)",
                marginBottom: "var(--space-3)",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1rem" }}>Traducciones</h2>
              <span
                className="btn-primary"
                style={{ padding: "6px 10px", borderRadius: 999, fontSize: "0.75rem" }}
              >
                {detail.translations.length}
              </span>
            </div>
            <p style={{ margin: 0, color: "var(--color-neutral-600)" }}>
              Idiomas configurados para esta ficha de país:{" "}
              <strong>
                {detail.translations.map((t) => t.languageCode.toUpperCase()).join(", ") || "—"}
              </strong>
              .
            </p>
          </article>
        </div>
      </section>

      {/* Country/commerce info */}
      <section
        style={{
          background: "rgba(255,255,255,0.92)",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: 20,
          padding: "var(--space-4)",
          boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)",
        }}
      >
        <h2 style={{ margin: "0 0 var(--space-3)", fontSize: "1rem" }}>
          Información comercial
        </h2>
        <div
          style={{
            display: "grid",
            gap: "var(--space-3)",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          }}
        >
          <ReadonlyField label="País" value={`${detail.countryName} (${detail.countryCode.toUpperCase()})`} />
          <ReadonlyField label="Slug" value={detail.slug} mono />
          <ReadonlyField label="Precio" value={`${detail.currency} ${detail.price.toFixed(2)}`} />
          <ReadonlyField label="Moneda" value={detail.currency} />
          <ReadonlyField label="URL eCommerce" value={detail.ecommerceUrl} mono />
          <ReadonlyField label="ID externo eCommerce" value={detail.ecommerceExternalId} mono />
        </div>
      </section>

      {/* Translations */}
      {detail.translations.length === 0 ? (
        <section
          style={{
            background: "rgba(255,255,255,0.92)",
            border: "1px solid var(--color-neutral-300)",
            borderRadius: 20,
            padding: "var(--space-4)",
            boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)",
          }}
        >
          <p style={{ margin: 0, color: "var(--color-neutral-500)" }}>
            Este producto por país no tiene traducciones configuradas todavía.
          </p>
        </section>
      ) : (
        detail.translations.map((translation) => (
          <section
            key={translation.languageCode}
            style={{
              background: "rgba(255,255,255,0.92)",
              border: "1px solid var(--color-neutral-300)",
              borderRadius: 20,
              padding: "var(--space-4)",
              boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                marginBottom: "var(--space-3)",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1rem" }}>
                Contenido — {translation.languageName}
              </h2>
              <span
                className="btn-primary"
                style={{ padding: "4px 8px", borderRadius: 999, fontSize: "0.72rem" }}
              >
                {translation.languageCode.toUpperCase()}
              </span>
            </div>

            {/* Basic info */}
            <div
              style={{
                display: "grid",
                gap: "var(--space-3)",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                marginBottom: "var(--space-4)",
              }}
            >
              <ReadonlyField label="Nombre" value={translation.name} />
              <ReadonlyField label="Descripción corta" value={translation.shortDescription} />
              <ReadonlyField label="Video URL" value={translation.videoUrl} mono />
            </div>

            {/* Long-form content */}
            {[
              { label: "Descripción larga", value: translation.longDescription },
              { label: "Introducción", value: translation.intro },
              { label: "Beneficios", value: translation.benefits },
              { label: "Aplicaciones", value: translation.applications },
              { label: "Uso", value: translation.usage },
              { label: "Restricciones", value: translation.restrictions },
              { label: "Recomendaciones", value: translation.recommendations },
            ].map(({ label, value }) => {
              const text = renderValue(value);
              if (text === "—") return null;
              return (
                <div
                  key={label}
                  style={{
                    marginBottom: "var(--space-3)",
                    paddingTop: "var(--space-3)",
                    borderTop: "1px solid var(--color-neutral-200)",
                  }}
                >
                  <ReadonlyField label={label} value={value} />
                </div>
              );
            })}

            {/* Información Técnica */}
            {!!translation.technicalInfo && (
              <div
                style={{
                  marginBottom: "var(--space-3)",
                  paddingTop: "var(--space-3)",
                  borderTop: "1px solid var(--color-neutral-200)",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--color-neutral-500)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Información técnica
                </span>
                <TechInfoBlock value={translation.technicalInfo} />
              </div>
            )}

            {/* SEO */}
            <div
              style={{
                marginTop: "var(--space-3)",
                paddingTop: "var(--space-3)",
                borderTop: "1px solid var(--color-neutral-200)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 var(--space-2)",
                  fontSize: "0.875rem",
                  color: "var(--color-neutral-600)",
                  fontWeight: 600,
                }}
              >
                SEO
              </h3>
              <div
                style={{
                  display: "grid",
                  gap: "var(--space-3)",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                }}
              >
                <ReadonlyField label="Título SEO" value={translation.seoTitle} />
                <ReadonlyField label="Descripción SEO" value={translation.seoDescription} />
                <ReadonlyField label="OG Image" value={translation.seoOgImage} mono />
              </div>
            </div>
          </section>
        ))
      )}

      {/* Images */}
      <section
        style={{
          background: "rgba(255,255,255,0.92)",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: 20,
          padding: "var(--space-4)",
          boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--space-3)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1rem" }}>
            Imágenes ({detail.images.length})
          </h2>
        </div>

        {detail.images.length === 0 ? (
          <p style={{ margin: 0, color: "var(--color-neutral-500)" }}>
            No hay imágenes cargadas para esta configuración regional.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "var(--space-3)",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            }}
          >
            {detail.images.map((img) => (
              <div
                key={img.id}
                style={{
                  border: img.isPrimary
                    ? "2px solid var(--color-primary, #0b5a3a)"
                    : "1px solid var(--color-neutral-300)",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "var(--color-neutral-100)",
                  position: "relative",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.altText ?? detail.productSku}
                  style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }}
                />
                {img.isPrimary && (
                  <span
                    style={{
                      position: "absolute",
                      top: 6,
                      left: 6,
                      background: "var(--color-primary, #0b5a3a)",
                      color: "#fff",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 999,
                    }}
                  >
                    Principal
                  </span>
                )}
                {img.altText && (
                  <p
                    style={{
                      margin: 0,
                      padding: "6px 8px",
                      fontSize: "0.72rem",
                      color: "var(--color-neutral-600)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {img.altText}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
