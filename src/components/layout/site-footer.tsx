export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ background: "var(--color-neutral-100)", borderTop: "1px solid var(--color-neutral-300)", marginTop: "auto" }}>
      <div className="site-container" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", paddingTop: "var(--space-6)", paddingBottom: "var(--space-6)" }}>
        <div style={{ fontSize: "0.875rem", color: "var(--color-neutral-600)" }}>
          © {year} Tiens. All rights reserved.
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
          Fase 1 · Catalog Base
        </div>
      </div>
    </footer>
  );
}
