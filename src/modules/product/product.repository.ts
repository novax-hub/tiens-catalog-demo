import { query, withTransaction } from "../../lib/db.ts";
import type { ProductBundleRow, ProductImage } from "./product.types.ts";

type ProductRow = {
  id: string;
  sku: string;
  is_active: boolean;
  created_at: Date | string | null;
  updated_at: Date | string | null;
};

type CountryRow = {
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

type TranslationRow = ProductBundleRow["translation"];

type ImageRow = ProductBundleRow["images"][number];

const DEFAULT_COUNTRY_CODE = "pe";
const DEFAULT_LANGUAGE_CODE = "es";

export async function findCountryByCode(code: string) {
  const result = await query<{ id: string; code: string; name: string }>(
    `SELECT id, code, name
     FROM country
     WHERE lower(code) = lower($1)
       AND is_active = TRUE
     LIMIT 1`,
    [code],
  );

  return result.rows[0] ?? null;
}

export async function listCountries(): Promise<Array<{ id: string; code: string; name: string }>> {
  const result = await query<{ id: string; code: string; name: string }>(
    `SELECT id, code, name
     FROM country
     WHERE is_active = TRUE
     ORDER BY name ASC`,
  );

  return result.rows;
}

export async function findLanguageByCode(code: string) {
  const result = await query<{ id: string; code: string; name: string }>(
    `SELECT id, code, name
     FROM language
     WHERE lower(code) = lower($1)
       AND is_active = TRUE
     LIMIT 1`,
    [code],
  );

  return result.rows[0] ?? null;
}

export async function listLanguages(): Promise<Array<{ id: string; code: string; name: string }>> {
  const result = await query<{ id: string; code: string; name: string }>(
    `SELECT id, code, name
     FROM language
     WHERE is_active = TRUE
     ORDER BY name ASC`,
  );

  return result.rows;
}

export async function listActiveProducts() {
  const result = await query<ProductRow>(
    `SELECT id, sku, is_active, created_at, updated_at
     FROM product
     WHERE is_active = TRUE
     ORDER BY created_at ASC, sku ASC`,
  );

  return result.rows;
}

export async function findProductById(productId: string) {
  const result = await query<ProductRow>(
    `SELECT id, sku, is_active, created_at, updated_at
     FROM product
     WHERE id = $1
       AND is_active = TRUE
     LIMIT 1`,
    [productId],
  );

  return result.rows[0] ?? null;
}

async function resolveProductCountryRow(productId: string, countryCode: string): Promise<CountryRow | null> {
  const requestedCountry = await query<CountryRow>(
    `SELECT
        pc.id,
        pc.country_id,
        c.code AS country_code,
        c.name AS country_name,
        pc.slug,
        pc.price,
        pc.currency,
        pc.ecommerce_url,
        pc.ecommerce_external_id,
        pc.is_active,
        pc.published_at,
        FALSE AS is_fallback_country
     FROM product_country pc
     JOIN country c ON c.id = pc.country_id
     WHERE pc.product_id = $1
       AND lower(c.code) = lower($2)
       AND pc.is_active = TRUE
     ORDER BY pc.published_at DESC NULLS LAST, pc.created_at DESC
     LIMIT 1`,
    [productId, countryCode],
  );

    if (requestedCountry.rows.length > 0) {
    return requestedCountry.rows[0];
  }

  const fallbackCountry = await query<CountryRow>(
    `SELECT
        pc.id,
        pc.country_id,
        c.code AS country_code,
        c.name AS country_name,
        pc.slug,
        pc.price,
        pc.currency,
        pc.ecommerce_url,
        pc.ecommerce_external_id,
        pc.is_active,
        pc.published_at,
        TRUE AS is_fallback_country
     FROM product_country pc
     JOIN country c ON c.id = pc.country_id
     WHERE pc.product_id = $1
       AND lower(c.code) = lower($2)
       AND pc.is_active = TRUE
     ORDER BY pc.published_at DESC NULLS LAST, pc.created_at DESC
     LIMIT 1`,
    [productId, DEFAULT_COUNTRY_CODE],
  );

  return fallbackCountry.rows[0] ?? null;
}

async function resolveProductTranslationRow(productCountryId: string, languageCode: string): Promise<TranslationRow> {
  const requestedTranslation = await query<NonNullable<TranslationRow>>(
    `SELECT
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
     LIMIT 1`,
    [productCountryId, languageCode],
  );

    if (requestedTranslation.rows.length > 0) {
    return requestedTranslation.rows[0];
  }

  const fallbackTranslation = await query<NonNullable<TranslationRow>>(
    `SELECT
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
     LIMIT 1`,
    [productCountryId, DEFAULT_LANGUAGE_CODE],
  );

  return fallbackTranslation.rows[0] ?? null;
}

async function listProductImages(productCountryId: string): Promise<ImageRow[]> {
  const result = await query<ImageRow>(
    `SELECT id, url, sort_order, alt_text, is_primary, created_at
     FROM product_image
     WHERE product_country_id = $1
     ORDER BY is_primary DESC, sort_order ASC, created_at ASC`,
    [productCountryId],
  );

  return result.rows;
}

function mapImageRow(image: ImageRow): ProductImage {
  return {
    id: image.id,
    url: image.url,
    sortOrder: Number(image.sort_order),
    altText: image.alt_text,
    isPrimary: image.is_primary,
  };
}

async function listProductImagesWithClient(client: { query: typeof query }, productCountryId: string): Promise<ProductImage[]> {
  const result = await client.query<ImageRow>(
    `SELECT id, url, sort_order, alt_text, is_primary, created_at
     FROM product_image
     WHERE product_country_id = $1
     ORDER BY sort_order ASC, created_at ASC, id ASC`,
    [productCountryId],
  );

  return result.rows.map(mapImageRow);
}

export async function appendProductImagesToProductCountry(
  productCountryId: string,
  images: Array<{ url: string; altText: string | null }>,
): Promise<ProductImage[]> {
  return withTransaction(async (client) => {
    if (images.length === 0) {
      return listProductImagesWithClient(client, productCountryId);
    }

    const current = await client.query<{ image_count: string; max_sort_order: string | null }>(
      `SELECT COUNT(*)::int AS image_count, MAX(sort_order) AS max_sort_order
       FROM product_image
       WHERE product_country_id = $1`,
      [productCountryId],
    );

    const imageCount = Number(current.rows[0]?.image_count ?? 0);
    const startSortOrder = Number(current.rows[0]?.max_sort_order ?? -1) + 1;

    for (const [index, image] of images.entries()) {
      await client.query(
        `INSERT INTO product_image (product_country_id, url, sort_order, alt_text, is_primary)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          productCountryId,
          image.url,
          startSortOrder + index,
          image.altText,
          imageCount === 0 && index === 0,
        ],
      );
    }

    return listProductImagesWithClient(client, productCountryId);
  });
}

function normalizeImageOrdering(images: ProductImage[], primaryImageId: string | null) {
  return images.map((image, index) => ({
    id: image.id,
    sortOrder: index,
    isPrimary: primaryImageId === image.id,
  }));
}

async function findProductCountryIdWithClient(client: { query: typeof query }, productId: string, countryCode: string) {
  const result = await client.query<{ id: string }>(
    `SELECT pc.id
     FROM product_country pc
     JOIN country c ON c.id = pc.country_id
     WHERE pc.product_id = $1
       AND lower(c.code) = lower($2)
     LIMIT 1`,
    [productId, countryCode],
  );

  return result.rows[0] ?? null;
}

export async function reorderProductImagesForPrimary(productId: string, countryCode: string, imageId: string) {
  return withTransaction(async (client) => {
    const productCountry = await findProductCountryIdWithClient(client, productId, countryCode);

    if (!productCountry) {
      return null;
    }

    const images = await listProductImagesWithClient(client, productCountry.id);
    const targetImage = images.find((image) => image.id === imageId);

    if (!targetImage) {
      return null;
    }

    const orderedImages = [targetImage, ...images.filter((image) => image.id !== imageId)];
    const normalizedImages = normalizeImageOrdering(orderedImages, imageId);

    for (const image of normalizedImages) {
      await client.query(
        `UPDATE product_image
         SET sort_order = $1,
             is_primary = $2
         WHERE id = $3
           AND product_country_id = $4`,
        [image.sortOrder, image.isPrimary, image.id, productCountry.id],
      );
    }

    return listProductImagesWithClient(client, productCountry.id);
  });
}

export async function deleteProductImageForProduct(productId: string, countryCode: string, imageId: string) {
  return withTransaction(async (client) => {
    const productCountry = await findProductCountryIdWithClient(client, productId, countryCode);

    if (!productCountry) {
      return null;
    }

    const images = await listProductImagesWithClient(client, productCountry.id);
    const targetImage = images.find((image) => image.id === imageId);

    if (!targetImage) {
      return null;
    }

    await client.query(
      `DELETE FROM product_image
       WHERE id = $1
         AND product_country_id = $2`,
      [imageId, productCountry.id],
    );

    const remainingImages = images.filter((image) => image.id !== imageId);
    const nextPrimaryId = targetImage.isPrimary ? remainingImages[0]?.id ?? null : remainingImages.find((image) => image.isPrimary)?.id ?? remainingImages[0]?.id ?? null;
    const normalizedImages = normalizeImageOrdering(remainingImages, nextPrimaryId);

    for (const image of normalizedImages) {
      await client.query(
        `UPDATE product_image
         SET sort_order = $1,
             is_primary = $2
         WHERE id = $3
           AND product_country_id = $4`,
        [image.sortOrder, image.isPrimary, image.id, productCountry.id],
      );
    }

    return listProductImagesWithClient(client, productCountry.id);
  });
}

export async function resolveProductBundle(productId: string, countryCode: string, languageCode: string): Promise<ProductBundleRow | null> {
  const product = await findProductById(productId);

  if (!product) {
    return null;
  }

  const country = await resolveProductCountryRow(productId, countryCode);

  if (!country) {
    return null;
  }

  const translation = await resolveProductTranslationRow(country.id, languageCode);

  if (!translation) {
    return null;
  }

  const images = await listProductImages(country.id);

  return {
    product,
    country,
    translation,
    images,
  };
}

export async function resolveProductCatalog(countryCode: string, languageCode: string) {
  const products = await listActiveProducts();
  const bundles: ProductBundleRow[] = [];

  for (const product of products) {
    const bundle = await resolveProductBundle(product.id, countryCode, languageCode);

    if (bundle) {
      bundles.push(bundle);
    }
  }

  return bundles;
}