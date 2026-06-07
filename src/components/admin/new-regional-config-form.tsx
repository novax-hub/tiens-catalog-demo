"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProductOption = { id: string; sku: string; name: string };
type Language = { id: string; code: string; name: string };

type NewRegionalConfigFormProps = {
  /** Active products that don't yet have a config for the admin's country. */
  availableProducts: ProductOption[];
  /** The admin's country (readonly — determined by permissions). */
  countryCode: string;
  countryName: string;
  availableLanguages: Language[];
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--color-neutral-300)",
  fontSize: "0.9rem",
  background: "var(--color-white)",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: "0.9rem",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const required = <span style={{ color: "#b91c1c" }}>*</span>;

export function NewRegionalConfigForm({
  availableProducts,
  countryCode,
  countryName,
  availableLanguages,
}: NewRegionalConfigFormProps) {
  const router = useRouter();

  const [productId, setProductId] = useState("");
  const [languageCode, setLanguageCode] = useState("");
  const [translationName, setTranslationName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("PEN");
  const [ecommerceUrl, setEcommerceUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = availableProducts.find((p) => p.id === productId) ?? null;

  function handleProductChange(id: string) {
    setProductId(id);
    const p = availableProducts.find((prod) => prod.id === id);
    if (p) setTranslationName(p.name);
    else setTranslationName("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!productId || !languageCode || !slug.trim() || !price || !currency) {
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
          translationName: translationName.trim() || selectedProduct?.name || "",
          ecommerceUrl: ecommerceUrl.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }

      const { productCountryId } = (data as { data: { productCountryId: string } }).data;
      router.push(`/admin/regional-configurations/${productCountryId}`);
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
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", maxWidth: 600 }}
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

      {/* Producto */}
      <div style={fieldStyle}>
        <label htmlFor="productId" style={labelStyle}>
          Producto {required}
        </label>
        {availableProducts.length === 0 ? (
          <p style={{ margin: 0, color: "var(--color-neutral-500)", fontSize: "0.9rem" }}>
            No hay productos activos sin configuración para {countryName}. Todos los productos activos ya tienen una ficha en este país.
          </p>
        ) : (
          <select
            id="productId"
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
            required
            style={inputStyle}
          >
            <option value="">— Selecciona un producto —</option>
            {availableProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} — {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* País (readonly) */}
      <div style={fieldStyle}>
        <span style={labelStyle}>País</span>
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "var(--color-neutral-50)",
            border: "1px solid var(--color-neutral-200)",
            fontSize: "0.9rem",
            color: "var(--color-neutral-700)",
          }}
        >
          {countryName}{" "}
          <span style={{ fontFamily: "monospace", color: "var(--color-neutral-500)" }}>
            ({countryCode.toUpperCase()})
          </span>
        </div>
      </div>

      {/* Idioma inicial */}
      <div style={fieldStyle}>
        <label htmlFor="languageCode" style={labelStyle}>
          Idioma inicial {required}
        </label>
        <select
          id="languageCode"
          value={languageCode}
          onChange={(e) => setLanguageCode(e.target.value)}
          required
          style={inputStyle}
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
      <div style={fieldStyle}>
        <label htmlFor="translationName" style={labelStyle}>
          Nombre en país {required}
        </label>
        <input
          id="translationName"
          type="text"
          value={translationName}
          onChange={(e) => setTranslationName(e.target.value)}
          required
          style={inputStyle}
          placeholder="Nombre del producto en este país"
        />
        <span style={{ fontSize: "0.8rem", color: "var(--color-neutral-500)" }}>
          Se autocompleta con el nombre global del producto al seleccionarlo.
        </span>
      </div>

      {/* Slug */}
      <div style={fieldStyle}>
        <label htmlFor="slug" style={labelStyle}>
          Slug {required}
        </label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="ej. viokal-pe"
          required
          style={{ ...inputStyle, fontFamily: "monospace" }}
        />
        <span style={{ fontSize: "0.8rem", color: "var(--color-neutral-500)" }}>
          Identificador URL único para este producto en {countryName}.
        </span>
      </div>

      {/* Precio + Moneda */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "var(--space-2)" }}>
        <div style={fieldStyle}>
          <label htmlFor="price" style={labelStyle}>
            Precio {required}
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
            style={inputStyle}
          />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="currency" style={labelStyle}>
            Moneda {required}
          </label>
          <input
            id="currency"
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={10}
            placeholder="PEN"
            required
            style={{ ...inputStyle, fontFamily: "monospace", width: 90 }}
          />
        </div>
      </div>

      {/* URL Ecommerce */}
      <div style={fieldStyle}>
        <label htmlFor="ecommerceUrl" style={labelStyle}>
          URL Ecommerce
        </label>
        <input
          id="ecommerceUrl"
          type="url"
          value={ecommerceUrl}
          onChange={(e) => setEcommerceUrl(e.target.value)}
          placeholder="https://..."
          style={{ ...inputStyle, fontFamily: "monospace" }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
        <button
          type="submit"
          disabled={pending || availableProducts.length === 0}
          className="btn-primary"
          style={{
            padding: "12px 24px",
            opacity: pending || availableProducts.length === 0 ? 0.6 : 1,
            cursor: pending || availableProducts.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          {pending ? "Guardando…" : "Crear configuración regional"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/regional-configurations")}
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
