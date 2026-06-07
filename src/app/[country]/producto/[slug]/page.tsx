import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCatalogProductDetailBySlug } from "@/lib/catalog-api.ts";
import { EcommerceCTAButton } from "@/components/ecommerce-cta-button";
import { ProductGallery } from "@/components/product-gallery";
import { isSupportedCountry } from "@/lib/countries";

type ProductPageProps = {
  params: Promise<{ country: string; slug: string }>;
};

export const dynamic = "force-dynamic";

const getYoutubeEmbedUrl = (url: string) => {
  const regExp = /(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/;
  const match = url.match(regExp);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { country, slug } = await params;

  if (!isSupportedCountry(country)) {
    notFound();
  }

  const response = await getCatalogProductDetailBySlug(country, slug, "es");

  if (!response) {
    notFound();
  }

  const { detail } = response;
  const sortedImages = [...detail.data.images].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) {
      return a.isPrimary ? -1 : 1;
    }

    return a.sortOrder - b.sortOrder;
  });
  const heroImageUrl = sortedImages[0]?.url ?? detail.data.heroImage ?? null;
  const galleryImageUrls = sortedImages.slice(1).map((image) => image.url);

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
          {heroImageUrl && (
            <ProductGallery
              heroImage={heroImageUrl}
              galleryImages={galleryImageUrls}
              productName={detail.data.name}
            />
          )}
        </div>

        {/* Content Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Name */}
          <h1 style={{ fontSize: "clamp(1.8rem, 5vw, var(--font-size-h2))", margin: 0, lineHeight: 1.1 }}>
            {detail.data.name}
          </h1>

          {/* Intro / Short Description */}
          {detail.data.intro && (
            <p style={{ fontSize: "var(--font-size-body)", color: "var(--color-neutral-700)" }}>
              {detail.data.intro}
            </p>
          )}

          {/* Price */}
          {detail.data.price && (
            <div style={{ fontSize: "clamp(1.5rem, 4vw, var(--font-size-h2))", fontWeight: 700, color: "var(--color-primary-700)", lineHeight: 1.1 }}>
              {detail.data.currency} {detail.data.price.toFixed(2)}
            </div>
          )}

          {/* CTA Button */}
          <div>
            <EcommerceCTAButton
              ecommerceUrl={detail.data.ecommerceUrl}
              label={detail.data.ctaLabel ?? undefined}
              className="btn-primary"
            />
          </div>
        </div>
      </div>

      {/* Content Sections Below (Same for desktop & mobile) */}
      <div style={{ marginTop: "var(--space-7)" }}>
        {/* Product Description */}
        {detail.data.longDescription && (
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h2 style={{ fontSize: "var(--font-size-h2)" }}>Descripción</h2>
            <p style={{ color: "var(--color-neutral-700)" }}>{detail.data.longDescription}</p>
          </div>
        )}

        {/* Benefits */}
        {detail.data.benefits && detail.data.benefits.length > 0 && (
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h3 style={{ fontSize: "var(--font-size-h3)" }}>Beneficio</h3>
            <ul style={{ margin: 0, paddingLeft: "var(--space-4)", color: "var(--color-neutral-700)" }}>
              {detail.data.benefits.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Usage */}
        {detail.data.usage && detail.data.usage.length > 0 && (
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h3 style={{ fontSize: "var(--font-size-h3)" }}>Uso</h3>
            <ul style={{ margin: 0, paddingLeft: "var(--space-4)", color: "var(--color-neutral-700)" }}>
              {detail.data.usage.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Applications */}
        {detail.data.applications && detail.data.applications.length > 0 && (
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h2 style={{ fontSize: "var(--font-size-h2)" }}>Aplicaciones</h2>
            <ul style={{ color: "var(--color-neutral-700)" }}>
              {detail.data.applications.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Restrictions */}
        {detail.data.restrictions && detail.data.restrictions.length > 0 && (
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h2 style={{ fontSize: "var(--font-size-h2)" }}>Restricciones</h2>
            <ul style={{ color: "var(--color-neutral-700)" }}>
              {detail.data.restrictions.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Technical Info */}
        {detail.data.technicalInfo && Object.keys(detail.data.technicalInfo).length > 0 && (
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h2 style={{ fontSize: "var(--font-size-h2)" }}>Información técnica</h2>
            <dl style={{ color: "var(--color-neutral-700)" }}>
              {Object.entries(detail.data.technicalInfo).map(([key, value]) => (
                <div key={key} style={{ marginBottom: "var(--space-2)" }}>
                  <dt style={{ fontWeight: 600 }}>{key}:</dt>
                  <dd style={{ margin: "0 0 0 var(--space-2)" }}>{typeof value === "string" ? value : JSON.stringify(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Video at the end */}
        {detail.data.videoUrl && (
          <div>
            <h2 style={{ fontSize: "var(--font-size-h2)" }}>Video</h2>
            <iframe
              width="100%"
              height="300"
              src={getYoutubeEmbedUrl(detail.data.videoUrl)}
              title={detail.data.name}
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
  if (!isSupportedCountry(country)) {
    return { title: "Producto no encontrado" };
  }

  const response = await getCatalogProductDetailBySlug(country, slug, "es");

  if (!response) {
    return { title: "Producto no encontrado" };
  }

  const { detail } = response;

  const title = detail.data.seoTitle ?? detail.data.name;
  const description = detail.data.seoDescription ?? detail.data.shortDescription ?? (detail.data.intro ? detail.data.intro.slice(0, 160) : undefined);
  const image = detail.data.seoOgImage ?? detail.data.heroImage ?? undefined;

  return {
    title,
    description,
    openGraph: image
      ? {
          title,
          description,
          images: [image],
        }
      : undefined,
  };
}
