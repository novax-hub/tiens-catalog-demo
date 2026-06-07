export default function AdminAuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="admin-auth-page">{children}</div>;
}