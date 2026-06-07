import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogProducts } from "@/lib/catalog-api.ts";
import { isSupportedCountry } from "@/lib/countries";

type CountryPageProps = {
  params: Promise<{ country: string }>;
};

export const dynamic = "force-dynamic";

export default async function CountryPage({ params }: CountryPageProps) {
  const { country } = await params;

  if (!isSupportedCountry(country)) {
    notFound();
  }

  const catalog = await getCatalogProducts(country, "es");

  return (
    <>
      <section style={{ background: "linear-gradient(135deg, var(--color-primary-700) 0%, var(--color-primary-500) 100%)", color: "var(--color-white)", padding: "var(--space-7) var(--space-4)", textAlign: "center", marginBottom: "var(--space-7)" }}>
        <div className="site-container" style={{ maxWidth: "800px", marginInline: "auto" }}>
          <h1 style={{ fontSize: "clamp(2rem, 6vw, var(--font-size-h1))", margin: "0 0 var(--space-3) 0", fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.1 }}>Productos Premium TIENS</h1>
          <p style={{ fontSize: "clamp(1rem, 2.5vw, var(--font-size-body))", margin: "0 0 var(--space-4) 0", lineHeight: 1.6, opacity: 0.95 }}>Descubre nuestra línea de productos de calidad superior diseñados para tu bienestar y salud</p>
          <a href="#products-section" className="hero-cta" style={{ cursor: "pointer" }}>Explorar Catálogo</a>
        </div>
      </section>

      <div className="site-container" id="products-section" style={{ marginBottom: "var(--space-7)" }}>
        <h2 style={{ fontSize: "var(--font-size-h2)", marginBottom: "var(--space-4)", color: "var(--color-neutral-900)", fontWeight: 700 }}>Nuestros Productos</h2>
        <div className="country-products-grid">
          {catalog.data.map((product) => (
            <div key={product.id} className="product-card" style={{ padding: "var(--space-3)", display: "flex", flexDirection: "column", border: "1px solid var(--color-neutral-300)", backgroundColor: "var(--color-white)", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
              {product.heroImage && (
                <div style={{ position: "relative", width: "100%", height: 200, marginBottom: "var(--space-3)", borderRadius: 8, overflow: "hidden" }}>
                  <Image
                    src={product.heroImage}
                    alt={product.name}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}
              <h3 style={{ fontSize: "var(--font-size-h3)", margin: "0 0 var(--space-2) 0", color: "var(--color-neutral-900)", fontWeight: 600, lineHeight: 1.2 }}>{product.name}</h3>
              <p style={{ fontSize: "var(--font-size-small)", color: "var(--color-neutral-600)", marginBottom: "var(--space-3)", flex: 1, lineHeight: 1.5 }}>{product.shortDescription || "Producto premium Tiens"}</p>
              {product.price && (
                <p style={{ fontSize: "var(--font-size-body)", fontWeight: 700, color: "var(--color-primary-700)", marginBottom: "var(--space-3)" }}>{product.currency} {product.price.toFixed(2)}</p>
              )}
              <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "auto" }}>
                <Link href={`/${country}/producto/${product.slug}`} style={{ flex: 1 }} className="btn-primary">
                  Ver detalles
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params;
  const siteTitle = "Productos Premium TIENS";
  const description =
    "Descubre nuestra línea de productos de calidad superior diseñados para tu bienestar y salud";

  if (!isSupportedCountry(country)) {
    return {
      title: siteTitle,
      description,
    };
  }

  const catalog = await getCatalogProducts(country, "es");
  const firstProduct = catalog.data[0];

  const image = firstProduct
    ? firstProduct.heroImage ?? undefined
    : undefined;

  return {
    title: siteTitle,
    description,
    openGraph: image
      ? {
          title: siteTitle,
          description,
          images: [image],
        }
      : undefined,
  };
}
