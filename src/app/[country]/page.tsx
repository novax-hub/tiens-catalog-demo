import Link from "next/link";
import catalog from "@/mock-data/catalog.fase1.mock.json";

type CountryPageProps = {
  params: Promise<{ country: string }>;
};

export default async function CountryPage({ params }: CountryPageProps) {
  const { country } = await params;

  return (
    <div className="site-container">
      <h1 style={{ fontSize: "var(--font-size-h1)", marginBottom: "var(--space-4)" }}>
        Catálogo de Productos
      </h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "var(--space-4)",
        }}
      >
        {catalog.products.map((product) => (
          <Link
            key={product.id}
            href={`/${country}/producto/${product.slug}`}
            className="card-base"
            style={{ padding: "var(--space-3)", display: "flex", flexDirection: "column", cursor: "pointer", transition: "box-shadow 0.2s ease" }}
          >
            {product.countries.pe.heroImage && (
              <img
                src={`/${product.countries.pe.heroImage}`}
                alt={product.countries.pe.translations.es.name}
                style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 8, marginBottom: "var(--space-3)" }}
              />
            )}
            <h3 style={{ fontSize: "var(--font-size-h3)", margin: "0 0 var(--space-2) 0" }}>
              {product.countries.pe.translations.es.name}
            </h3>
            <p style={{ fontSize: "var(--font-size-small)", color: "var(--color-neutral-600)", marginBottom: "var(--space-3)" }}>
              {product.countries.pe.translations.es.shortDescription || "Producto premium Tiens"}
            </p>
            {product.countries.pe.price.amount && (
              <p style={{ fontSize: "var(--font-size-body)", fontWeight: 600, color: "var(--color-primary-700)" }}>
                S/ {product.countries.pe.price.amount.toFixed(2)}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
