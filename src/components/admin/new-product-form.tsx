"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewProductForm() {
  const router = useRouter();
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!sku.trim() || !name.trim()) {
      setError("SKU y Nombre son requeridos.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: sku.trim(), name: name.trim(), isActive }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error ?? "Error al guardar el producto.");
        return;
      }

      router.push(`/admin/products/${json.data.id}`);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <section
        style={{
          background: "rgba(255,255,255,0.92)",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: 20,
          padding: "var(--space-4)",
          boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)",
        }}
      >
        <div style={{ display: "grid", gap: "var(--space-3)", gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}>
          {/* SKU */}
          <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              htmlFor="sku"
              style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-neutral-700)" }}
            >
              SKU
            </label>
            <input
              id="sku"
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="A01"
              required
              style={{
                width: "100%",
                border: "1px solid var(--color-neutral-300)",
                borderRadius: 12,
                padding: "12px 14px",
                font: "inherit",
                background: "var(--color-white)",
                textTransform: "uppercase",
              }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
              Código único del producto en el catálogo global.
            </span>
          </div>

          {/* Nombre */}
          <div style={{ gridColumn: "span 8", display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              htmlFor="name"
              style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-neutral-700)" }}
            >
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Viokal"
              required
              style={{
                width: "100%",
                border: "1px solid var(--color-neutral-300)",
                borderRadius: 12,
                padding: "12px 14px",
                font: "inherit",
                background: "var(--color-white)",
              }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
              Nombre comercial global del producto.
            </span>
          </div>

          {/* Estado */}
          <div style={{ gridColumn: "span 12", display: "flex", alignItems: "center", gap: 10 }}>
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--color-primary-600)", cursor: "pointer" }}
            />
            <label
              htmlFor="isActive"
              style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-neutral-700)", cursor: "pointer" }}
            >
              Activo
            </label>
            <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
              Los productos activos son visibles en la landing cuando tienen una configuración regional publicada.
            </span>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                gridColumn: "span 12",
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: 10,
                padding: "12px 14px",
                color: "#b91c1c",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ gridColumn: "span 12", display: "flex", gap: "var(--space-2)" }}>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
