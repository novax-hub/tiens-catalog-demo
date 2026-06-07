export type LocaleInput = {
  country?: string;
  lang?: string;
};

export type LocaleResolution = {
  requestedCountry: string;
  requestedLanguage: string;
  resolvedCountry: string;
  resolvedLanguage: string;
  countryFallback: boolean;
  languageFallback: boolean;
};

export type ProductImage = {
  id: string;
  url: string;
  sortOrder: number;
  altText: string | null;
  isPrimary: boolean;
};

export type ProductSummary = {
  id: string;
  sku: string;
  country: string;
  countryName: string;
  slug: string;
  price: number;
  currency: string;
  ecommerceUrl: string;
  ecommerceExternalId: string | null;
  isActive: boolean;
  publishedAt: string | null;
  name: string;
  shortDescription: string | null;
  heroImage: string | null;
  translationLanguage: string;
  isFallbackCountry: boolean;
};

export type ProductDetail = ProductSummary & {
  longDescription: string | null;
  intro: string | null;
  benefits: string[] | null;
  applications: string[] | null;
  usage: string[] | null;
  restrictions: string[] | null;
  recommendations: string[] | null;
  technicalInfo: Record<string, unknown> | null;
  features: Record<string, unknown> | null;
  ctaLabel: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoOgImage: string | null;
  videoUrl: string | null;
  images: ProductImage[];
};

export type ProductBundleRow = {
  product: {
    id: string;
    sku: string;
    is_active: boolean;
    created_at: Date | string | null;
    updated_at: Date | string | null;
  };
  country: {
    id: string;
    country_id: string;
    country_code: string;
    country_name: string;
    slug: string;
    price: string | number;
    currency: string;
    ecommerce_url: string;
    ecommerce_external_id: string | null;
    is_active: boolean;
    published_at: Date | string | null;
    is_fallback_country: boolean;
  };
  translation: {
    id: string;
    language_code: string;
    name: string;
    short_description: string | null;
    long_description: string | null;
    intro: string | null;
    benefits: unknown;
    applications: unknown;
    usage: unknown;
    restrictions: unknown;
    recommendations: unknown;
    technical_info: unknown;
    features: unknown;
    cta_label: string | null;
    seo_title: string | null;
    seo_description: string | null;
    seo_og_image: string | null;
    video_url: string | null;
  } | null;
  images: Array<{
    id: string;
    url: string;
    sort_order: number;
    alt_text: string | null;
    is_primary: boolean;
    created_at: Date | string | null;
  }>;
};

export type ProductCatalogResponse = {
  meta: {
    requestedCountry: string;
    requestedLanguage: string;
    resolvedCountry: string;
    resolvedLanguage: string;
    countryFallback: boolean;
    languageFallback: boolean;
    count: number;
  };
  data: ProductSummary[];
};

export type ProductDetailResponse = {
  meta: {
    requestedCountry: string;
    requestedLanguage: string;
    resolvedCountry: string;
    resolvedLanguage: string;
    countryFallback: boolean;
    languageFallback: boolean;
  };
  data: ProductDetail;
};