import type { ProductBundleRow, ProductDetail, ProductImage, ProductSummary } from "./product.types.ts";

function toNumber(value: string | number): number {
  return typeof value === "number" ? value : Number(value);
}

function toIsoString(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function toStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value.filter((item): item is string => typeof item === "string");

  return items.length > 0 ? items : null;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function mapImages(images: ProductBundleRow["images"]): ProductImage[] {
  return images.map((image) => ({
    id: image.id,
    url: image.url,
    sortOrder: Number(image.sort_order),
    altText: image.alt_text,
    isPrimary: image.is_primary,
  }));
}

export function mapBundleToSummary(bundle: ProductBundleRow): ProductSummary {
  if (!bundle.translation) {
    throw new Error(`Missing translation for product ${bundle.product.id}`);
  }

  const primaryImage = bundle.images.find((image) => image.is_primary) ?? bundle.images[0] ?? null;

  return {
    id: bundle.product.id,
    sku: bundle.product.sku,
    country: bundle.country.country_code,
    countryName: bundle.country.country_name,
    slug: bundle.country.slug,
    price: toNumber(bundle.country.price),
    currency: bundle.country.currency,
    ecommerceUrl: bundle.country.ecommerce_url,
    ecommerceExternalId: bundle.country.ecommerce_external_id,
    isActive: bundle.product.is_active && bundle.country.is_active,
    publishedAt: toIsoString(bundle.country.published_at),
    name: bundle.translation.name,
    shortDescription: bundle.translation.short_description,
    heroImage: primaryImage?.url ?? bundle.translation.seo_og_image ?? null,
    translationLanguage: bundle.translation.language_code,
    isFallbackCountry: bundle.country.is_fallback_country,
  };
}

export function mapBundleToDetail(bundle: ProductBundleRow): ProductDetail {
  if (!bundle.translation) {
    throw new Error(`Missing translation for product ${bundle.product.id}`);
  }

  const summary = mapBundleToSummary(bundle);

  return {
    ...summary,
    longDescription: bundle.translation.long_description,
    intro: bundle.translation.intro,
    benefits: toStringArray(bundle.translation.benefits),
    applications: toStringArray(bundle.translation.applications),
    usage: toStringArray(bundle.translation.usage),
    restrictions: toStringArray(bundle.translation.restrictions),
    recommendations: toStringArray(bundle.translation.recommendations),
    technicalInfo: toRecord(bundle.translation.technical_info),
    features: toRecord(bundle.translation.features),
    ctaLabel: bundle.translation.cta_label,
    seoTitle: bundle.translation.seo_title,
    seoDescription: bundle.translation.seo_description,
    seoOgImage: bundle.translation.seo_og_image,
    videoUrl: bundle.translation.video_url,
    images: mapImages(bundle.images),
  };
}