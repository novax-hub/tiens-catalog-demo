import { query } from "@/lib/db.ts";
import type { ProductBundleRow } from "./product.types.ts";
import type {
  AdminGlobalProductDetail,
  AdminGlobalProductListItem,
  AdminRegionalProductDetail,
  AdminRegionalProductListItem,
} from "./admin-product.types.ts";

// ---- internal row types (DB → TS) ----

type AdminGlobalProductRow = {
  id: string;
  sku: string;
  name: string;
  is_active: boolean;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  countries: Array<{
    countryCode: string;
    countryName: string;
    slug: string;
    price: string | number;
    currency: string;
    isActive: boolean;
  }> | null;
};

type AdminProductCountryRow = {
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
};

type AdminTranslationRow = {
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
};

type AdminImageRow = {
  id: string;
  url: string;
  sort_order: number;
  alt_text: string | null;
  is_primary: boolean;
  created_at: Date | string | null;
};

// ---- public functions ----

/**
 * Lists all products in the global catalog for admin backoffice.
 * Unlike the public catalog, this:
 * - includes inactive products
 * - groups by global product, not by region
 * - aggregates all configured countries per product
 * - does not apply country or language fallback
 */
export async function listAdminGlobalProducts(): Promise<AdminGlobalProductListItem[]> {
  const result = await query<AdminGlobalProductRow>(
    `SELECT
        p.id,
        p.sku,
        p.name,
        p.is_active,
        p.created_at,
        p.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'countryCode', c.code,
              'countryName', c.name,
              'slug',        pc.slug,
              'price',       pc.price,
              'currency',    pc.currency,
              'isActive',    pc.is_active
            ) ORDER BY c.code
          ) FILTER (WHERE pc.id IS NOT NULL),
          '[]'::json
        ) AS countries
     FROM product p
     LEFT JOIN product_country pc ON pc.product_id = p.id
     LEFT JOIN country c          ON c.id = pc.country_id
     GROUP BY p.id, p.sku, p.name, p.is_active, p.created_at, p.updated_at
     ORDER BY p.created_at ASC, p.sku ASC`,
  );

  return result.rows.map((row) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    isActive: row.is_active,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    countries: (row.countries ?? []).map((c) => ({
      countryCode: c.countryCode,
      countryName: c.countryName,
      slug: c.slug,
      price: Number(c.price),
      currency: c.currency,
      isActive: c.isActive,
    })),
  }));
}

/**
 * Resolves a complete product bundle for admin backoffice.
 * Unlike the public resolver, this:
 * - includes inactive products and product_country records
 * - does NOT fall back to another country if the requested one is not found
 * - falls back to Spanish (es) if the requested language is not found
 *
 * Returns null if the product or its country configuration does not exist.
 * The returned bundle is compatible with the existing product mapper functions.
 */
export async function findAdminProductBundle(
  productId: string,
  countryCode: string,
  languageCode: string,
): Promise<ProductBundleRow | null> {
  const productResult = await query<{
    id: string;
    sku: string;
    is_active: boolean;
    created_at: Date | string | null;
    updated_at: Date | string | null;
  }>(
    `SELECT id, sku, is_active, created_at, updated_at
     FROM product
     WHERE id = $1
     LIMIT 1`,
    [productId],
  );

  if (productResult.rows.length === 0) return null;
  const product = productResult.rows[0];

  const pcResult = await query<AdminProductCountryRow>(
    `SELECT
        pc.id,
        pc.country_id,
        c.code  AS country_code,
        c.name  AS country_name,
        pc.slug,
        pc.price,
        pc.currency,
        pc.ecommerce_url,
        pc.ecommerce_external_id,
        pc.is_active,
        pc.published_at
     FROM product_country pc
     JOIN country c ON c.id = pc.country_id
     WHERE pc.product_id = $1
       AND lower(c.code) = lower($2)
     LIMIT 1`,
    [productId, countryCode],
  );

  if (pcResult.rows.length === 0) return null;
  const countryRow = pcResult.rows[0];

  const translationSql = `
    SELECT
        pt.id,
        lang.code AS language_code,
        pt.name,
        pt.short_description,
        pt.long_description,
        pt.intro,
        pt.benefits,
        pt.applications,
        pt.usage,
        pt.restrictions,
        pt.recommendations,
        pt.technical_info,
        pt.features,
        pt.cta_label,
        pt.seo_title,
        pt.seo_description,
        pt.seo_og_image,
        pt.video_url
     FROM product_translation pt
     JOIN language lang ON lang.id = pt.language_id
     WHERE pt.product_country_id = $1
       AND lower(lang.code) = lower($2)
     LIMIT 1`;

  let translationResult = await query<AdminTranslationRow>(translationSql, [countryRow.id, languageCode]);

  if (translationResult.rows.length === 0 && languageCode !== "es") {
    translationResult = await query<AdminTranslationRow>(translationSql, [countryRow.id, "es"]);
  }

  const imagesResult = await query<AdminImageRow>(
    `SELECT id, url, sort_order, alt_text, is_primary, created_at
     FROM product_image
     WHERE product_country_id = $1
     ORDER BY is_primary DESC, sort_order ASC, created_at ASC`,
    [countryRow.id],
  );

  return {
    product,
    country: {
      id: countryRow.id,
      country_id: countryRow.country_id,
      country_code: countryRow.country_code,
      country_name: countryRow.country_name,
      slug: countryRow.slug,
      price: countryRow.price,
      currency: countryRow.currency,
      ecommerce_url: countryRow.ecommerce_url,
      ecommerce_external_id: countryRow.ecommerce_external_id,
      is_active: countryRow.is_active,
      published_at: countryRow.published_at,
      is_fallback_country: false,
    },
    translation: translationResult.rows[0] ?? null,
    images: imagesResult.rows,
  };
}

/**
 * Resolves the full global detail of a product for admin backoffice (PANTALLA 2).
 * Returns the product with ALL configured countries and, for each country,
 * ALL available language translations — without any fallback.
 */
export async function findAdminGlobalProductDetail(
  productId: string,
): Promise<AdminGlobalProductDetail | null> {
  type DetailRow = {
    id: string;
    sku: string;
    name: string;
    is_active: boolean;
    created_at: Date | string | null;
    updated_at: Date | string | null;
    countries: Array<{
      countryCode: string;
      countryName: string;
      slug: string;
      price: string | number;
      currency: string;
      isActive: boolean;
      languages: Array<{ languageCode: string; languageName: string; name: string | null }>;
    }> | null;
  };

  const result = await query<DetailRow>(
    `SELECT
        p.id,
        p.sku,
        p.name,
        p.is_active,
        p.created_at,
        p.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'countryCode', c.code,
              'countryName', c.name,
              'slug',        pc.slug,
              'price',       pc.price,
              'currency',    pc.currency,
              'isActive',    pc.is_active,
              'languages',   (
                SELECT COALESCE(
                  json_agg(
                    json_build_object(
                      'languageCode', l.code,
                      'languageName', l.name,
                      'name',         pt.name
                    ) ORDER BY l.code
                  ),
                  '[]'::json
                )
                FROM product_translation pt
                JOIN language l ON l.id = pt.language_id
                WHERE pt.product_country_id = pc.id
              )
            ) ORDER BY c.code
          ) FILTER (WHERE pc.id IS NOT NULL),
          '[]'::json
        ) AS countries
     FROM product p
     LEFT JOIN product_country pc ON pc.product_id = p.id
     LEFT JOIN country          c  ON c.id = pc.country_id
     WHERE p.id = $1
     GROUP BY p.id, p.sku, p.name, p.is_active, p.created_at, p.updated_at
     LIMIT 1`,
    [productId],
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0];

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    isActive: row.is_active,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    countries: (row.countries ?? []).map((c) => ({
      countryCode: c.countryCode,
      countryName: c.countryName,
      slug: c.slug,
      price: Number(c.price),
      currency: c.currency,
      isActive: c.isActive,
      languages: (c.languages ?? []).map((l) => ({
        languageCode: l.languageCode,
        languageName: l.languageName,
        name: l.name,
      })),
    })),
  };
}

/**
 * Lists product-country-translation combinations for admin backoffice (PANTALLA 4).
 *
 * - allowedCountryCodes: pass null for SUPER_ADMIN (no country filter).
 *   Pass a non-empty array to restrict results to those countries only (ADMIN/EDITOR/ASSISTANT).
 * - Includes both active and inactive records (admin needs to see all states).
 * - Does NOT apply language fallback — each row is a distinct language configuration.
 */
export async function listAdminRegionalProducts(options: {
  allowedCountryCodes: string[] | null;
}): Promise<AdminRegionalProductListItem[]> {
  type RegionalRow = {
    product_id: string;
    product_sku: string;
    is_globally_active: boolean;
    product_country_id: string;
    country_code: string;
    country_name: string;
    language_code: string;
    language_name: string;
    name: string | null;
    slug: string;
    price: string | number;
    currency: string;
    is_regionally_active: boolean;
  };

  const baseSql = `
    SELECT
        p.id           AS product_id,
        p.sku          AS product_sku,
        p.is_active    AS is_globally_active,
        pc.id          AS product_country_id,
        c.code         AS country_code,
        c.name         AS country_name,
        l.code         AS language_code,
        l.name         AS language_name,
        pt.name        AS name,
        pc.slug,
        pc.price,
        pc.currency,
        pc.is_active   AS is_regionally_active
     FROM product p
     JOIN product_country    pc ON pc.product_id = p.id
     JOIN country            c  ON c.id = pc.country_id
     JOIN product_translation pt ON pt.product_country_id = pc.id
     JOIN language           l  ON l.id = pt.language_id`;

  let sql = baseSql;
  const params: unknown[] = [];

  if (options.allowedCountryCodes !== null && options.allowedCountryCodes.length > 0) {
    const normalized = options.allowedCountryCodes.map((code) => code.toLowerCase());
    sql += `\n     WHERE lower(c.code) = ANY($1)`;
    params.push(normalized);
  }

  sql += `\n     ORDER BY c.name ASC, p.sku ASC, l.code ASC`;

  const result = await query<RegionalRow>(sql, params);

  return result.rows.map((row) => ({
    productId: row.product_id,
    productSku: row.product_sku,
    productCountryId: row.product_country_id,
    countryCode: row.country_code,
    countryName: row.country_name,
    languageCode: row.language_code,
    languageName: row.language_name,
    name: row.name,
    slug: row.slug,
    price: Number(row.price),
    currency: row.currency,
    isRegionallyActive: row.is_regionally_active,
    isGloballyActive: row.is_globally_active,
  }));
}

/**
 * Returns the full read-only detail for a single product_country record (PR 6 — PANTALLA 5).
 *
 * - Includes all language translations for the product_country.
 * - Includes all images ordered by sort_order.
 * - Returns null if the product_country does not exist.
 * - Country access enforcement is the caller's responsibility.
 */
export async function findAdminRegionalProductDetail(
  productCountryId: string,
): Promise<AdminRegionalProductDetail | null> {
  type PcRow = {
    product_id: string;
    product_sku: string;
    is_globally_active: boolean;
    product_country_id: string;
    country_code: string;
    country_name: string;
    slug: string;
    price: string | number;
    currency: string;
    ecommerce_url: string;
    ecommerce_external_id: string | null;
    is_regionally_active: boolean;
  };

  const pcResult = await query<PcRow>(
    `SELECT
        p.id          AS product_id,
        p.sku         AS product_sku,
        p.is_active   AS is_globally_active,
        pc.id         AS product_country_id,
        c.code        AS country_code,
        c.name        AS country_name,
        pc.slug,
        pc.price,
        pc.currency,
        pc.ecommerce_url,
        pc.ecommerce_external_id,
        pc.is_active  AS is_regionally_active
     FROM product_country pc
     JOIN product p ON p.id = pc.product_id
     JOIN country c ON c.id = pc.country_id
     WHERE pc.id = $1
     LIMIT 1`,
    [productCountryId],
  );

  if (pcResult.rows.length === 0) return null;
  const pc = pcResult.rows[0];

  type TranslationRow = {
    language_code: string;
    language_name: string;
    name: string | null;
    short_description: string | null;
    long_description: string | null;
    intro: string | null;
    benefits: unknown;
    applications: unknown;
    usage: unknown;
    restrictions: unknown;
    recommendations: unknown;
    technical_info: unknown;
    video_url: string | null;
    seo_title: string | null;
    seo_description: string | null;
    seo_og_image: string | null;
  };

  type ImageRow = {
    id: string;
    url: string;
    alt_text: string | null;
    sort_order: number;
    is_primary: boolean;
  };

  const [translationsResult, imagesResult] = await Promise.all([
    query<TranslationRow>(
      `SELECT
          l.code  AS language_code,
          l.name  AS language_name,
          pt.name,
          pt.short_description,
          pt.long_description,
          pt.intro,
          pt.benefits,
          pt.applications,
          pt.usage,
          pt.restrictions,
          pt.recommendations,
          pt.technical_info,
          pt.video_url,
          pt.seo_title,
          pt.seo_description,
          pt.seo_og_image
       FROM product_translation pt
       JOIN language l ON l.id = pt.language_id
       WHERE pt.product_country_id = $1
       ORDER BY l.code ASC`,
      [productCountryId],
    ),
    query<ImageRow>(
      `SELECT id, url, alt_text, sort_order, is_primary
       FROM product_image
       WHERE product_country_id = $1
       ORDER BY is_primary DESC, sort_order ASC, created_at ASC`,
      [productCountryId],
    ),
  ]);

  return {
    productId: pc.product_id,
    productSku: pc.product_sku,
    isGloballyActive: pc.is_globally_active,
    productCountryId: pc.product_country_id,
    countryCode: pc.country_code,
    countryName: pc.country_name,
    slug: pc.slug,
    price: Number(pc.price),
    currency: pc.currency,
    ecommerceUrl: pc.ecommerce_url,
    ecommerceExternalId: pc.ecommerce_external_id,
    isRegionallyActive: pc.is_regionally_active,
    translations: translationsResult.rows.map((t) => ({
      languageCode: t.language_code,
      languageName: t.language_name,
      name: t.name,
      shortDescription: t.short_description,
      longDescription: t.long_description,
      intro: t.intro,
      benefits: t.benefits,
      applications: t.applications,
      usage: t.usage,
      restrictions: t.restrictions,
      recommendations: t.recommendations,
      technicalInfo: t.technical_info,
      videoUrl: t.video_url,
      seoTitle: t.seo_title,
      seoDescription: t.seo_description,
      seoOgImage: t.seo_og_image,
    })),
    images: imagesResult.rows.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.alt_text,
      sortOrder: img.sort_order,
      isPrimary: img.is_primary,
    })),
  };
}

/**
 * Lists active global products that do NOT yet have a product_country record
 * for the given country code. Used by ADMIN to populate the product dropdown
 * when creating a new regional configuration.
 */
export async function listActiveProductsWithoutCountry(
  countryCode: string,
): Promise<Array<{ id: string; sku: string; name: string }>> {
  const result = await query<{ id: string; sku: string; name: string }>(
    `SELECT p.id, p.sku, p.name
     FROM product p
     WHERE p.is_active = TRUE
       AND NOT EXISTS (
         SELECT 1
         FROM product_country pc
         JOIN country c ON c.id = pc.country_id
         WHERE pc.product_id = p.id
           AND lower(c.code) = lower($1)
       )
     ORDER BY p.name ASC, p.sku ASC`,
    [countryCode],
  );
  return result.rows;
}
