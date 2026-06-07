"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Country = { id: string; code: string; name: string };
type Language = { id: string; code: string; name: string };

type AddCountryFormProps = {
  productId: string;
  productSku: string;
  productName: string;
  availableCountries: Country[];
  availableLanguages: Language[];
  /** Country codes already configured for this product (to disable them in the select). */
  configuredCountryCodes: string[];
};

export function AddCountryForm({
  productId,
  productSku,
  productName,
  availableCountries,
  availableLanguages,
  configuredCountryCodes,
}: AddCountryFormProps) {
  const router = useRouter();

  const [countryCode, setCountryCode] = useState("");
  const [languageCode, setLanguageCode] = useState("");
  const [slug, setSlug] = useState("");
  const [translationName, setTranslationName] = useState(productName);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("PEN");
  const [ecommerceUrl, setEcommerceUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configuredSet = new Set(configuredCountryCodes.map((c) => c.toLowerCase()));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!countryCode || !languageCode || !slug.trim() || !price || !currency) {
      setError("Completa todos los campos requeridos.");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setError("El precio debe ser un número positivo.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/countries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode,
          languageCode,
          slug: slug.trim(),
          price: priceNum,
          currency: currency.toUpperCase(),
          translationName: translationName.trim() || productName,
          ecommerceUrl: ecommerceUrl.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }

      // Redirect back to the global product detail
      router.push(`/admin/products/${productId}`);
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", maxWidth: 560 }}
    >
      {error && (
        <div
          role="alert"
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            background: "#fff0f0",
            border: "1px solid #fca5a5",
            color: "#b91c1c",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          background: "var(--color-neutral-50)",
          border: "1px solid var(--color-neutral-200)",
          fontSize: "0.9rem",
        }}
      >
        <span style={{ color: "var(--color-neutral-500)", fontWeight: 600 }}>Producto:&nbsp;</span>
        <span style={{ fontFamily: "monospace" }}>{productSku}</span>
        {productName && (
          <span style={{ color: "var(--color-neutral-600)" }}>&nbsp;— {productName}</span>
        )}
      </div>

      {/* País */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor="countryCode" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
          País <span style={{ color: "#b91c1c" }}>*</span>
        </label>
        <select
          id="countryCode"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          required
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--color-neutral-300)",
            fontSize: "0.9rem",
            background: "var(--color-white)",
          }}
        >
          <option value="">— Selecciona un país —</option>
          {availableCountries.map((c) => (
            <option
              key={c.code}
              value={c.code}
              disabled={configuredSet.has(c.code.toLowerCase())}
            >
              {c.name} ({c.code.toUpperCase()})
              {configuredSet.has(c.code.toLowerCase()) ? " — ya configurado" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Idioma inicial */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor="languageCode" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
          Idioma inicial <span style={{ color: "#b91c1c" }}>*</span>
        </label>
        <select
          id="languageCode"
          value={languageCode}
          onChange={(e) => setLanguageCode(e.target.value)}
          required
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--color-neutral-300)",
            fontSize: "0.9rem",
            background: "var(--color-white)",
          }}
        >
          <option value="">— Selecciona un idioma —</option>
          {availableLanguages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name} ({l.code.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* Nombre en País */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor="translationName" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
          Nombre en país <span style={{ color: "#b91c1c" }}>*</span>
        </label>
        <input
          id="translationName"
          type="text"
          value={translationName}
          onChange={(e) => setTranslationName(e.target.value)}
          required
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--color-neutral-300)",
            fontSize: "0.9rem",
          }}
        />
        <span style={{ fontSize: "0.8rem", color: "var(--color-neutral-500)" }}>
          Cómo aparece el nombre del producto en la ficha de este país.
        </span>
      </div>

      {/* Slug */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor="slug" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
          Slug <span style={{ color: "#b91c1c" }}>*</span>
        </label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="ej. viokal-pe"
          required
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--color-neutral-300)",
            fontSize: "0.9rem",
            fontFamily: "monospace",
          }}
        />
        <span style={{ fontSize: "0.8rem", color: "var(--color-neutral-500)" }}>
          Identificador URL único para este producto en el país seleccionado.
        </span>
      </div>

      {/* Precio */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "var(--space-2)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="price" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
            Precio <span style={{ color: "#b91c1c" }}>*</span>
          </label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--color-neutral-300)",
              fontSize: "0.9rem",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="currency" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
            Moneda <span style={{ color: "#b91c1c" }}>*</span>
          </label>
          <input
            id="currency"
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={10}
            placeholder="PEN"
            required
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--color-neutral-300)",
              fontSize: "0.9rem",
              fontFamily: "monospace",
              width: 90,
            }}
          />
        </div>
      </div>

      {/* URL Ecommerce */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor="ecommerceUrl" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
          URL Ecommerce
        </label>
        <input
          id="ecommerceUrl"
          type="url"
          value={ecommerceUrl}
          onChange={(e) => setEcommerceUrl(e.target.value)}
          placeholder="https://..."
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--color-neutral-300)",
            fontSize: "0.9rem",
            fontFamily: "monospace",
          }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
        <button
          type="submit"
          disabled={pending}
          className="btn-primary"
          style={{ padding: "12px 24px", opacity: pending ? 0.6 : 1, cursor: pending ? "not-allowed" : "pointer" }}
        >
          {pending ? "Guardando…" : "Agregar país"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/admin/products/${productId}`)}
          className="btn-primary"
          style={{
            padding: "12px 24px",
            background: "var(--color-white)",
            color: "var(--color-neutral-900)",
            border: "1px solid var(--color-neutral-300)",
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
