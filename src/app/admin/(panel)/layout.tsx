import { AdminPanelShell } from "@/components/admin/admin-panel-shell";

export default function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminPanelShell>{children}</AdminPanelShell>;
}