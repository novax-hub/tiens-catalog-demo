import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  AUTH_SESSION_COOKIE_NAME,
  canEditCountryProduct,
  canToggleCountryProductActivation,
  hasCountryAccess,
  readAuthSession,
} from "@/lib/auth.ts";
import { findAdminRegionalProductDetail } from "@/modules/product/admin-product.repository.ts";
import { RegionalProductEditor } from "@/components/admin/regional-product-editor.tsx";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ productCountryId: string }>;
};

export default async function EditRegionalConfigurationPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const session = await readAuthSession(
    cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value,
  );

  if (!session) redirect("/admin/login");

  const { productCountryId } = await params;

  // ASSISTANT role cannot edit
  if (!canEditCountryProduct(session.role)) {
    redirect(`/admin/regional-configurations/${productCountryId}`);
  }

  const detail = await findAdminRegionalProductDetail(productCountryId);
  if (!detail) notFound();

  if (!hasCountryAccess(session, detail.countryCode)) {
    redirect("/admin/regional-configurations");
  }

  const canToggle = canToggleCountryProductActivation(session.role);

  return (
    <div
      style={{
        maxWidth: 1080,
        margin: "0 auto",
        padding: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "rgba(255,255,255,0.92)",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: 20,
          padding: "var(--space-4)",
          boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
        }}
      >
        <nav aria-label="Breadcrumb">
          <Link
            href={`/admin/regional-configurations/${productCountryId}`}
            style={{ color: "var(--color-primary-700)", textDecoration: "none", fontSize: "0.875rem" }}
          >
            ← Volver al detalle
          </Link>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700 }}>
            Editar configuración regional
          </h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span
              className="btn-primary"
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: "0.8rem",
                background: "var(--color-white)",
                color: "var(--color-neutral-900)",
                border: "1px solid var(--color-neutral-300)",
              }}
            >
              SKU: {detail.productSku}
            </span>
            <span
              className="btn-primary"
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: "0.8rem",
              }}
            >
              {detail.countryName} ({detail.countryCode.toUpperCase()})
            </span>
          </div>
        </div>
      </header>

      {/* Editor */}
      <RegionalProductEditor detail={detail} canToggle={canToggle} />
    </div>
  );
}
