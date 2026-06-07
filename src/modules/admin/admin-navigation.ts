import type { AuthRole } from "@/lib/auth";

export type AdminNavItem = {
  href: string;
  label: string;
  meta: string;
};

export function getAdminLandingPath(role: AuthRole): string {
  if (role === "EDITOR" || role === "ASSISTANT") {
    return "/admin/regional-configurations";
  }

  return "/admin/dashboard";
}

export function getAdminNavItems(role: AuthRole | undefined): AdminNavItem[] {
  return [
    ...(role && (role === "SUPER_ADMIN" || role === "ADMIN")
      ? [{ href: "/admin/dashboard", label: "Dashboard", meta: "Inicio del panel" }]
      : []),
    ...(role === "SUPER_ADMIN"
      ? [{ href: "/admin/products", label: "Productos", meta: "Catálogo global" }]
      : []),
    { href: "/admin/regional-configurations", label: "Productos por País", meta: "Config. regionales" },
    ...(role && (role === "SUPER_ADMIN" || role === "ADMIN")
      ? [{ href: "/admin/users", label: "Usuarios", meta: "Gestión de acceso" }]
      : []),
    { href: "/api/auth/logout", label: "Cerrar sesión", meta: "Salir del panel" },
  ];
}