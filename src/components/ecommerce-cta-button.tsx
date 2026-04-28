"use client";

import { useState } from "react";

type EcommerceCTAButtonProps = {
  ecommerceUrl?: string | null;
  label?: string;
  className?: string;
};

export function EcommerceCTAButton({
  ecommerceUrl,
  label = "Comprar",
  className = "btn-primary",
}: EcommerceCTAButtonProps) {
  const [error, setError] = useState<boolean>(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!ecommerceUrl) {
      setError(true);
      return;
    }
    try {
      window.open(ecommerceUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Error opening e-commerce link:", err);
      setError(true);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", alignItems: "center" }}>
      <button
        onClick={handleClick}
        className={className}
        disabled={!ecommerceUrl}
        aria-disabled={!ecommerceUrl}
        style={{ width: "100%" }}
      >
        {label}
      </button>
      {error && (
        <p style={{ fontSize: "var(--font-size-small)", color: "var(--color-red-600)" }}>
          No se pudo abrir el enlace. Por favor, intenta más tarde.
        </p>
      )}
    </div>
  );
}
