/**
 * Admin-specific view models for backoffice.
 * These are intentionally separate from the public catalog types
 * (ProductSummary, ProductDetail) to allow the admin data layer
 * to evolve independently from the public storefront API.
 */

export type AdminProductCountrySummary = {
  countryCode: string;
  countryName: string;
  slug: string;
  price: number;
  currency: string;
  isActive: boolean;
};

export type AdminGlobalProductListItem = {
  id: string;
  sku: string;
  name: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  countries: AdminProductCountrySummary[];
};

// ---- Global product detail (PANTALLA 2) ----

export type AdminGlobalProductLanguage = {
  languageCode: string;
  languageName: string;
  /** Display name from the translation for this language. */
  name: string | null;
};

export type AdminGlobalProductCountryDetail = AdminProductCountrySummary & {
  languages: AdminGlobalProductLanguage[];
};

export type AdminGlobalProductDetail = {
  id: string;
  sku: string;
  name: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  countries: AdminGlobalProductCountryDetail[];
};

// ---- Regional product list (PANTALLA 4) ----

export type AdminRegionalProductListItem = {
  productId: string;
  productSku: string;
  productCountryId: string;
  countryCode: string;
  countryName: string;
  languageCode: string;
  languageName: string;
  /** Translated product name for this language. */
  name: string | null;
  slug: string;
  price: number;
  currency: string;
  isRegionallyActive: boolean;
  isGloballyActive: boolean;
};

// ---- Regional product detail — read-only (PR 6) ----

export type AdminRegionalProductTranslation = {
  languageCode: string;
  languageName: string;
  name: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  intro: string | null;
  benefits: unknown;
  applications: unknown;
  usage: unknown;
  restrictions: unknown;
  recommendations: unknown;
  technicalInfo: unknown;
  videoUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoOgImage: string | null;
};

export type AdminRegionalProductImage = {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

export type AdminRegionalProductDetail = {
  productId: string;
  productSku: string;
  isGloballyActive: boolean;
  productCountryId: string;
  countryCode: string;
  countryName: string;
  slug: string;
  price: number;
  currency: string;
  ecommerceUrl: string;
  ecommerceExternalId: string | null;
  isRegionallyActive: boolean;
  translations: AdminRegionalProductTranslation[];
  images: AdminRegionalProductImage[];
};
