import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Dashboard oculto temporalmente — redirige a Productos
  redirect("/admin/products");
}
