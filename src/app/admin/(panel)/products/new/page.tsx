import Link from "next/link";
import { NewProductForm } from "@/components/admin/new-product-form.tsx";

export const dynamic = "force-dynamic";

export default function AdminProductNewPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <div>
          <span className="btn-primary" style={{ padding: "6px 10px", borderRadius: 999, fontSize: "0.75rem" }}>
            Nuevo producto
          </span>
          <h1 style={{ margin: "8px 0 6px", fontSize: "clamp(1.6rem, 3vw, 2.3rem)", lineHeight: 1.1 }}>
            Nuevo producto global
          </h1>
          <p style={{ margin: 0, maxWidth: "58ch", color: "var(--color-neutral-600)" }}>
            Registra el producto en el catálogo global. Después podrás agregar configuraciones por país.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="btn-primary"
          style={{ background: "var(--color-white)", color: "var(--color-neutral-900)", border: "1px solid var(--color-neutral-300)" }}
        >
          Volver al listado
        </Link>
      </div>

      <NewProductForm />
    </div>
  );
}
