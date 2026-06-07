"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";

type CountryOption = { code: string; name: string };
type LanguageOption = { code: string; name: string };

type RegionalConfigurationsFiltersProps = {
  countries: CountryOption[];
  languages: LanguageOption[];
};

export function RegionalConfigurationsFilters({
  countries,
  languages,
}: RegionalConfigurationsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to first page when a filter changes
      params.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const selectedCountry = searchParams.get("country") ?? "";
  const selectedLanguage = searchParams.get("language") ?? "";
  const selectedStatus = searchParams.get("status") ?? "";
  const selectedQ = searchParams.get("q") ?? "";

  const selectStyle: React.CSSProperties = {
    padding: "8px 12px",
    border: "1px solid var(--color-neutral-300)",
    borderRadius: 10,
    fontSize: "0.875rem",
    background: "var(--color-white)",
    color: "var(--color-neutral-900)",
    minWidth: 140,
    opacity: isPending ? 0.6 : 1,
    cursor: isPending ? "not-allowed" : "default",
  };

  const inputStyle: React.CSSProperties = {
    ...selectStyle,
    minWidth: 200,
    flexGrow: 1,
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "var(--space-2)",
      }}
    >
      {/* Text search */}
      <input
        type="search"
        placeholder="Buscar por SKU o nombre..."
        defaultValue={selectedQ}
        style={inputStyle}
        onChange={(e) => {
          const value = e.target.value;
          // debounce with a simple timeout
          const timer = setTimeout(() => updateParam("q", value), 300);
          return () => clearTimeout(timer);
        }}
        aria-label="Buscar por SKU o nombre"
      />

      {/* Country filter */}
      <select
        value={selectedCountry}
        style={selectStyle}
        disabled={isPending}
        aria-label="Filtrar por país"
        onChange={(e) => updateParam("country", e.target.value)}
      >
        <option value="">Todos los países</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code.toLowerCase()}>
            {c.name} ({c.code.toUpperCase()})
          </option>
        ))}
      </select>

      {/* Language filter */}
      <select
        value={selectedLanguage}
        style={selectStyle}
        disabled={isPending}
        aria-label="Filtrar por idioma"
        onChange={(e) => updateParam("language", e.target.value)}
      >
        <option value="">Todos los idiomas</option>
        {languages.map((l) => (
          <option key={l.code} value={l.code.toLowerCase()}>
            {l.name} ({l.code.toUpperCase()})
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={selectedStatus}
        style={selectStyle}
        disabled={isPending}
        aria-label="Filtrar por estado regional"
        onChange={(e) => updateParam("status", e.target.value)}
      >
        <option value="">Todos los estados</option>
        <option value="active">Activos</option>
        <option value="inactive">Inactivos</option>
      </select>

      {/* Clear filters */}
      {(selectedCountry || selectedLanguage || selectedStatus || selectedQ) && (
        <button
          type="button"
          onClick={() => {
            startTransition(() => {
              router.replace(pathname);
            });
          }}
          style={{
            padding: "8px 14px",
            border: "1px solid var(--color-neutral-300)",
            borderRadius: 10,
            fontSize: "0.875rem",
            background: "transparent",
            color: "var(--color-neutral-600)",
            cursor: "pointer",
          }}
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
