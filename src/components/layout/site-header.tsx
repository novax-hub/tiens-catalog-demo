import Link from "next/link";

type SiteHeaderProps = {
  country: string;
};

export function SiteHeader({ country }: SiteHeaderProps) {
  return (
    <header style={{ background: "var(--color-white)", borderBottom: "1px solid var(--color-neutral-300)" }}>
      <div className="site-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 72 }}>
        <Link href={`/${country}`} style={{ fontWeight: 700, letterSpacing: 0.2 }}>
          TIENS Catalog
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", color: "var(--color-neutral-700)" }}>
          <Link href={`/${country}`}>Productos</Link>
          <Link href="/admin">Mantenedor</Link>
        </nav>
      </div>
    </header>
  );
}
