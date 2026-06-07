"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type GlobalProductToggleProps = {
  productId: string;
  isActive: boolean;
};

/**
 * Client component that toggles the global `is_active` flag of a product.
 * Calls PUT /api/admin/products/{id} with { isActive: !current }.
 * Refreshes the server component tree after a successful toggle.
 */
export function GlobalProductToggle({ productId, isActive }: GlobalProductToggleProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Error al cambiar estado: ${(data as { error?: string }).error ?? res.status}`);
        return;
      }

      router.refresh();
    } catch {
      alert("Error de red al intentar cambiar el estado global.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className="btn-primary"
      style={{
        padding: "8px 14px",
        borderRadius: 10,
        fontSize: "0.875rem",
        opacity: pending ? 0.6 : 1,
        cursor: pending ? "not-allowed" : "pointer",
        background: isActive
          ? "var(--color-neutral-100)"
          : "linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))",
        color: isActive ? "var(--color-neutral-700)" : "var(--color-white)",
        border: isActive ? "1px solid var(--color-neutral-300)" : "none",
      }}
    >
      {pending ? "Guardando…" : isActive ? "Desactivar globalmente" : "Activar globalmente"}
    </button>
  );
}
