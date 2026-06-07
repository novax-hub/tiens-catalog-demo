"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties, FormEvent, ReactNode } from "react";

import type { AuthRole } from "@/lib/auth";
import type { AdminUserDetail } from "@/modules/user/admin-user.types.ts";

type CountryOption = { code: string; name: string };

type UserEditFormProps = {
  currentRole: AuthRole;
  availableCountries: CountryOption[];
  user: AdminUserDetail;
};

type UserRoleOption = AuthRole;

type EditDraft = {
  name: string;
  role: UserRoleOption;
  isActive: boolean;
  countryCodes: string[];
};

const ROLE_LABELS: Record<AuthRole, string> = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  ASSISTANT: "ASSISTANT",
};

const ALL_ROLE_OPTIONS: UserRoleOption[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "ASSISTANT"];
const NON_ADMIN_ROLE_OPTIONS: UserRoleOption[] = ["EDITOR", "ASSISTANT"];

const cardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.92)",
  border: "1px solid var(--color-neutral-300)",
  borderRadius: 20,
  padding: "var(--space-4)",
  boxShadow: "0 20px 48px rgba(11, 90, 58, 0.06)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid var(--color-neutral-300)",
  borderRadius: 12,
  padding: "12px 14px",
  font: "inherit",
  background: "var(--color-white)",
};

const labelStyle: CSSProperties = {
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "var(--color-neutral-700)",
};

function FieldLabel({ children }: { children: ReactNode }) {
  return <label style={labelStyle}>{children}</label>;
}

function CountryChecklist({
  countries,
  value,
  onChange,
}: {
  countries: CountryOption[];
  value: string[];
  onChange: (countryCodes: string[]) => void;
}) {
  const selected = useMemo(() => new Set(value.map((code) => code.toLowerCase())), [value]);

  const toggle = (code: string) => {
    const normalized = code.toLowerCase();
    if (selected.has(normalized)) {
      onChange(value.filter((entry) => entry.toLowerCase() !== normalized));
      return;
    }
    onChange([...value, normalized]);
  };

  return (
    <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
      {countries.map((country) => {
        const checked = selected.has(country.code.toLowerCase());
        return (
          <label
            key={country.code}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              border: "1px solid var(--color-neutral-300)",
              borderRadius: 12,
              padding: "10px 12px",
              background: checked ? "rgba(15, 118, 74, 0.06)" : "var(--color-white)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(country.code)}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <strong style={{ fontSize: "0.9rem" }}>{country.name}</strong>
              <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)", fontFamily: "monospace" }}>
                {country.code.toUpperCase()}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function UserEditForm({ currentRole, availableCountries, user }: UserEditFormProps) {
  const router = useRouter();
  const roleOptions = currentRole === "SUPER_ADMIN" ? ALL_ROLE_OPTIONS : NON_ADMIN_ROLE_OPTIONS;

  const [draft, setDraft] = useState<EditDraft>({
    name: user.name,
    role: user.role as UserRoleOption,
    isActive: user.isActive,
    countryCodes: user.countryCodes.map((code) => code.toLowerCase()),
  });
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showCountryPicker = draft.role !== "SUPER_ADMIN";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);

    if (!draft.name.trim()) {
      setStatus("El nombre no puede quedar vacío.");
      return;
    }

    if (showCountryPicker && draft.countryCodes.length === 0) {
      setStatus("Selecciona al menos un país.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          role: draft.role,
          isActive: draft.isActive,
          countryCodes: showCountryPicker ? draft.countryCodes : [],
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "No se pudo actualizar el usuario");
      }

      router.push(`/admin/users/${user.id}`);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo actualizar el usuario.");
      setLoading(false);
    }
  };

  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1rem" }}>Editar usuario</h2>
          <p style={{ margin: "4px 0 0", color: "var(--color-neutral-600)" }}>{user.email}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ display: "grid", gap: "var(--space-3)", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FieldLabel>Nombre</FieldLabel>
              <input
                style={inputStyle}
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FieldLabel>Rol</FieldLabel>
              <select
                style={inputStyle}
                value={draft.role}
                onChange={(event) => {
                  const nextRole = event.target.value as UserRoleOption;
                  setDraft((current) => ({
                    ...current,
                    role: nextRole,
                    countryCodes: nextRole === "SUPER_ADMIN" ? [] : current.countryCodes,
                  }));
                }}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                Activo
              </label>
            </div>
          </div>

          {showCountryPicker && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FieldLabel>Países</FieldLabel>
              <CountryChecklist
                countries={availableCountries}
                value={draft.countryCodes}
                onChange={(countryCodes) => setDraft((current) => ({ ...current, countryCodes }))}
              />
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{ background: "var(--color-white)", color: "var(--color-neutral-900)", border: "1px solid var(--color-neutral-300)" }}
              onClick={() => router.push(`/admin/users/${user.id}`)}
            >
              Cancelar
            </button>
            {status && <p style={{ margin: 0, color: "var(--color-neutral-600)" }}>{status}</p>}
          </div>
        </form>
      </div>
    </section>
  );
}