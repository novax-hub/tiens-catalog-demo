"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";

import type { AuthRole } from "@/lib/auth";
import type { AdminUserListItem } from "@/modules/user/admin-user.types.ts";

type CountryOption = { code: string; name: string };

type UserManagementPanelProps = {
  availableCountries: CountryOption[];
  users: AdminUserListItem[];
};

const ROLE_LABELS: Record<AuthRole, string> = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  ASSISTANT: "ASSISTANT",
};

const ALL_ROLE_OPTIONS: AuthRole[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "ASSISTANT"];
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
  padding: "10px 12px",
  font: "inherit",
  background: "var(--color-white)",
};

function normalizeCode(value: string) {
  return value.trim().toLowerCase();
}

function formatCountries(codes: string[]) {
  if (codes.length === 0) return "Global";
  return codes.map((code) => code.toUpperCase()).join(", ");
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function UserManagementPanel({ availableCountries, users }: UserManagementPanelProps) {
  const router = useRouter();

  const [textFilter, setTextFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [tableStatus, setTableStatus] = useState<string | null>(null);
  const [toggleLoadingUserId, setToggleLoadingUserId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const q = textFilter.trim().toLowerCase();

    return users.filter((user) => {
      if (q && !user.name.toLowerCase().includes(q)) return false;
      if (statusFilter === "active" && !user.isActive) return false;
      if (statusFilter === "inactive" && user.isActive) return false;
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (countryFilter !== "all") {
        const target = normalizeCode(countryFilter);
        if (!user.countryCodes.some((code) => normalizeCode(code) === target)) return false;
      }
      return true;
    });
  }, [countryFilter, roleFilter, statusFilter, textFilter, users]);

  const deactivateUser = async (user: AdminUserListItem) => {
    if (!user.isActive) return;

    setToggleLoadingUserId(user.id);
    setTableStatus(null);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "No se pudo desactivar el usuario");
      }

      router.refresh();
    } catch (error) {
      setTableStatus(error instanceof Error ? error.message : "No se pudo desactivar el usuario.");
    } finally {
      setToggleLoadingUserId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <section style={cardStyle}>
        <div style={{ display: "grid", gap: "var(--space-3)", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: "0.8rem", color: "var(--color-neutral-600)", fontWeight: 600 }}>Nombre</label>
            <input
              style={inputStyle}
              value={textFilter}
              onChange={(event) => setTextFilter(event.target.value)}
              placeholder="Buscar por nombre"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: "0.8rem", color: "var(--color-neutral-600)", fontWeight: 600 }}>Estado</label>
            <select style={inputStyle} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}>
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: "0.8rem", color: "var(--color-neutral-600)", fontWeight: 600 }}>País</label>
            <select style={inputStyle} value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}>
              <option value="all">Todos</option>
              {availableCountries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: "0.8rem", color: "var(--color-neutral-600)", fontWeight: 600 }}>Rol</label>
            <select style={inputStyle} value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="all">Todos</option>
              {ALL_ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        {tableStatus && <p style={{ margin: "0 0 12px", color: "var(--color-red-600)" }}>{tableStatus}</p>}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 940 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-neutral-300)" }}>
                <th style={{ padding: "10px 8px" }}>Nombre</th>
                <th style={{ padding: "10px 8px" }}>Email</th>
                <th style={{ padding: "10px 8px" }}>Rol</th>
                <th style={{ padding: "10px 8px" }}>Estado</th>
                <th style={{ padding: "10px 8px" }}>Países</th>
                <th style={{ padding: "10px 8px" }}>Último acceso</th>
                <th style={{ padding: "10px 8px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "14px 8px", color: "var(--color-neutral-600)" }}>
                    No se encontraron usuarios con los filtros actuales.
                  </td>
                </tr>
              )}
              {filteredUsers.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid var(--color-neutral-200)" }}>
                  <td style={{ padding: "12px 8px", fontWeight: 600 }}>{user.name}</td>
                  <td style={{ padding: "12px 8px", color: "var(--color-neutral-700)" }}>{user.email}</td>
                  <td style={{ padding: "12px 8px" }}>{ROLE_LABELS[user.role as AuthRole] ?? user.role}</td>
                  <td style={{ padding: "12px 8px", color: user.isActive ? "var(--color-primary-700)" : "var(--color-red-600)", fontWeight: 700 }}>
                    {user.isActive ? "Activo" : "Inactivo"}
                  </td>
                  <td style={{ padding: "12px 8px" }}>{formatCountries(user.countryCodes)}</td>
                  <td style={{ padding: "12px 8px", color: "var(--color-neutral-600)" }}>{formatDate(user.lastLoginAt)}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Link
                        href={`/admin/users/${user.id}`}
                        title="Ver"
                        aria-label="Ver usuario"
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid var(--color-neutral-300)", textDecoration: "none", color: "var(--color-neutral-900)" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>

                      <Link
                        href={`/admin/users/${user.id}/edit`}
                        title="Editar"
                        aria-label="Editar usuario"
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid var(--color-neutral-300)", textDecoration: "none", color: "var(--color-neutral-900)" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>

                      <button
                        type="button"
                        title={user.isActive ? "Desactivar" : "Desactivado"}
                        aria-label={user.isActive ? "Desactivar usuario" : "Usuario desactivado"}
                        onClick={() => void deactivateUser(user)}
                        disabled={!user.isActive || toggleLoadingUserId === user.id}
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: user.isActive ? "#991b1b" : "#f3f3f3", border: "1px solid var(--color-neutral-300)", color: "white", padding: 0 }}
                      >
                        {toggleLoadingUserId === user.id ? (
                          <span style={{ fontSize: 12 }}>...</span>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6 6l12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
