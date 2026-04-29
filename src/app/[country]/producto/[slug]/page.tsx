import { notFound } from "next/navigation";
import type { Metadata } from "next";
import catalog from "@/mock-data/catalog.fase1.mock.json";
import { EcommerceCTAButton } from "@/components/ecommerce-cta-button";
import { ProductGallery } from "@/components/product-gallery";

type ProductPageProps = {
  params: Promise<{ country: string; slug: string }>;
};

const getCountryData = (product: (typeof catalog.products)[number], country: string) => {
  return product.countries[country as keyof typeof product.countries] ?? product.countries.pe;
};

export async function generateStaticParams() {
  return catalog.products.flatMap((product) =>
    ["pe", "ec", "bo", "co", "mx"].map((country) => ({
      country,
      slug: product.slug,
    }))
  );
}

const getYoutubeEmbedUrl = (url: string) => {
  const regExp = /(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/;
  const match = url.match(regExp);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { country, slug } = await params;
  const product = catalog.products.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  const countryData = getCountryData(product, country);
  const translations = countryData.translations.es;

  return (
    <div className="site-container">
      <div style={{ marginBottom: "var(--space-6)" }}>
        <a href={`/${country}`} style={{ color: "var(--color-primary-700)", textDecoration: "underline" }}>
          ← Volver al catálogo
        </a>
      </div>

      {/* Hero + Main Content Layout (Desktop: 2-col, Mobile: 1-col) */}
      <div className="product-detail-layout">
        {/* Image Gallery Section */}
        <div>
          {countryData.heroImage && (
            <ProductGallery
              heroImage={countryData.heroImage}
              galleryImages={countryData.images || []}
              productName={translations.name}
              isMobile={false}
            />
          )}
        </div>

        {/* Content Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Name */}
          <h1 style={{ fontSize: "clamp(1.8rem, 5vw, var(--font-size-h2))", margin: 0, lineHeight: 1.1 }}>
            {translations.name}
          </h1>

          {/* Intro / Short Description */}
          {translations.intro && (
            <p style={{ fontSize: "var(--font-size-body)", color: "var(--color-neutral-700)" }}>
              {translations.intro}
            </p>
          )}

          {/* Price */}
          {countryData.price.amount && (
            <div style={{ fontSize: "clamp(1.5rem, 4vw, var(--font-size-h2))", fontWeight: 700, color: "var(--color-primary-700)", lineHeight: 1.1 }}>
              {countryData.price.currency} {countryData.price.amount.toFixed(2)}
            </div>
          )}

          {/* CTA Button */}
          <div>
            <EcommerceCTAButton
              ecommerceUrl={countryData.ecommerceUrl}
              label={translations.ctaLabel}
              className="btn-primary"
            />
          </div>
        </div>
      </div>

      {/* Content Sections Below (Same for desktop & mobile) */}
      <div style={{ marginTop: "var(--space-7)" }}>
        {/* Product Description */}
        {translations.longDescription && (
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h2 style={{ fontSize: "var(--font-size-h2)" }}>Descripción</h2>
            <p style={{ color: "var(--color-neutral-700)" }}>{translations.longDescription}</p>
          </div>
        )}

        {/* Benefits */}
        {translations.benefits && translations.benefits.length > 0 && (
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h3 style={{ fontSize: "var(--font-size-h3)" }}>Beneficio</h3>
            <ul style={{ margin: 0, paddingLeft: "var(--space-4)", color: "var(--color-neutral-700)" }}>
              {translations.benefits.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Usage */}
        {translations.usage && translations.usage.length > 0 && (
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h3 style={{ fontSize: "var(--font-size-h3)" }}>Uso</h3>
            <ul style={{ margin: 0, paddingLeft: "var(--space-4)", color: "var(--color-neutral-700)" }}>
              {translations.usage.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Applications */}
        {translations.applications && translations.applications.length > 0 && (
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h2 style={{ fontSize: "var(--font-size-h2)" }}>Aplicaciones</h2>
            <ul style={{ color: "var(--color-neutral-700)" }}>
              {translations.applications.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Restrictions */}
        {translations.restrictions && translations.restrictions.length > 0 && (
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h2 style={{ fontSize: "var(--font-size-h2)" }}>Restricciones</h2>
            <ul style={{ color: "var(--color-neutral-700)" }}>
              {translations.restrictions.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Technical Info */}
        {Object.keys(translations.technicalInfo).length > 0 && (
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h2 style={{ fontSize: "var(--font-size-h2)" }}>Información técnica</h2>
            <dl style={{ color: "var(--color-neutral-700)" }}>
              {Object.entries(translations.technicalInfo).map(([key, value]) => (
                <div key={key} style={{ marginBottom: "var(--space-2)" }}>
                  <dt style={{ fontWeight: 600 }}>{key}:</dt>
                  <dd style={{ margin: "0 0 0 var(--space-2)" }}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Video at the end */}
        {translations.videoUrl && (
          <div>
            <h2 style={{ fontSize: "var(--font-size-h2)" }}>Video</h2>
            <iframe
              width="100%"
              height="300"
              src={getYoutubeEmbedUrl(translations.videoUrl)}
              title={translations.name}
              style={{ borderRadius: 8 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ country: string; slug: string }> }): Promise<Metadata> {
  const { country, slug } = await params;
  const product = catalog.products.find((p) => p.slug === slug);

  if (!product) {
    return { title: "Producto no encontrado" };
  }

  const countryData = product.countries[country as keyof typeof product.countries] ?? product.countries.pe;
  const translations = countryData.translations.es;

  const title = translations.seo?.title ?? translations.name;
  const description = translations.seo?.description ?? translations.shortDescription ?? (translations.intro ? translations.intro.slice(0, 160) : undefined);
  const image = translations.seo?.ogImage ?? countryData.heroImage;

  return {
    title,
    description,
    openGraph: image
      ? {
          title,
          description,
          images: [`/${image}`],
        }
      : undefined,
  };
}
