import { NextRequest } from "next/server";
import {
  AUTH_SESSION_COOKIE_NAME,
  canEditCountryProduct,
  canManageGlobalProducts,
  canToggleCountryProductActivation,
  hasCountryAccess,
  readAuthSession,
} from "@/lib/auth.ts";
import { withTransaction } from "@/lib/db.ts";
import { parseEcommerceExternalId } from "@/lib/ecommerce.ts";
import { findCountryByCode, findLanguageByCode, resolveProductBundle } from "@/modules/product/product.repository.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UpdatePayload = {
  sku?: string;
  isActive?: boolean;
  country?: {
    code: string;
    slug?: string;
    priceAmount?: number;
    priceCurrency?: string;
    ecommerceUrl?: string;
    isActive?: boolean;
    publishedAt?: string | null;
  };
  translation?: {
    languageCode: string;
    name?: string;
    shortDescription?: string | null;
    longDescription?: string | null;
    intro?: string | null;
    benefits?: unknown;
    applications?: unknown;
    usage?: unknown;
    restrictions?: unknown;
    recommendations?: unknown;
    technicalInfo?: unknown;
    ctaLabel?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    seoOgImage?: string | null;
    videoUrl?: string | null;
  };
};

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await readAuthSession(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    if (!id) return Response.json({ error: 'Missing product id' }, { status: 400 });

    let body: UpdatePayload;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid body' }, { status: 400 });
    }

    const targetCountryCode = body.country?.code ?? session.countryCodes[0] ?? 'pe';
    const isGlobalMutation = body.sku !== undefined || body.isActive !== undefined;
    const isCountryMutation = body.country !== undefined || body.translation !== undefined;

    if (isGlobalMutation && !canManageGlobalProducts(session.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isCountryMutation && !canEditCountryProduct(session.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isCountryMutation && !hasCountryAccess(session, targetCountryCode)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (body.country?.isActive !== undefined && !canToggleCountryProductActivation(session.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await withTransaction(async (client) => {
      // update product
      if (body.sku !== undefined || body.isActive !== undefined) {
        await client.query(`UPDATE product SET sku = COALESCE($1, sku), is_active = COALESCE($2, is_active), updated_at = NOW() WHERE id = $3`, [body.sku ?? null, body.isActive ?? null, id]);
      }

      let countryCode = targetCountryCode;

      const country = await findCountryByCode(countryCode);
      if (!country) throw new Error('Invalid country code');

      // find existing product_country
      const pcRes = await client.query(`SELECT id, ecommerce_url FROM product_country WHERE product_id = $1 AND country_id = $2 LIMIT 1`, [id, country.id]);
      let productCountryId: string;
      if (pcRes.rows.length === 0) {
        // insert
        const ecommerceExternalId = parseEcommerceExternalId(body.country?.ecommerceUrl ?? null);
        const slug = body.country?.slug ?? id;
        const priceAmount = body.country?.priceAmount ?? 0;
        const currency = body.country?.priceCurrency ?? 'PEN';
        const pcInsert = await client.query(`INSERT INTO product_country (product_id, country_id, slug, price, currency, ecommerce_url, ecommerce_external_id, is_active, published_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`, [id, country.id, slug, priceAmount, currency, body.country?.ecommerceUrl ?? '', ecommerceExternalId, body.country?.isActive ?? true, body.country?.publishedAt ?? null]);
        productCountryId = pcInsert.rows[0].id;
      } else {
        productCountryId = pcRes.rows[0].id;
        // update ecommerceExternalId if ecommerceUrl provided or changed
        if (body.country?.ecommerceUrl !== undefined) {
          const ecommerceExternalId = parseEcommerceExternalId(body.country.ecommerceUrl ?? null);
          await client.query(`UPDATE product_country SET slug = COALESCE($1, slug), price = COALESCE($2, price), currency = COALESCE($3, currency), ecommerce_url = COALESCE($4, ecommerce_url), ecommerce_external_id = $5, is_active = COALESCE($6, is_active), published_at = COALESCE($7, published_at), updated_at = NOW() WHERE id = $8`, [body.country.slug ?? null, body.country.priceAmount ?? null, body.country.priceCurrency ?? null, body.country.ecommerceUrl ?? null, ecommerceExternalId, body.country.isActive ?? null, body.country.publishedAt ?? null, productCountryId]);
        } else {
          await client.query(`UPDATE product_country SET slug = COALESCE($1, slug), price = COALESCE($2, price), currency = COALESCE($3, currency), is_active = COALESCE($4, is_active), published_at = COALESCE($5, published_at), updated_at = NOW() WHERE id = $6`, [body.country?.slug ?? null, body.country?.priceAmount ?? null, body.country?.priceCurrency ?? null, body.country?.isActive ?? null, body.country?.publishedAt ?? null, productCountryId]);
        }
      }

      // upsert translation
      if (body.translation) {
        const language = await findLanguageByCode(body.translation.languageCode);
        if (!language) throw new Error('Invalid language code');

        const existing = await client.query(`SELECT id FROM product_translation WHERE product_country_id = $1 AND language_id = $2 LIMIT 1`, [productCountryId, language.id]);
        if (existing.rows.length === 0) {
          await client.query(`INSERT INTO product_translation (product_country_id, language_id, name, short_description, long_description, intro, benefits, applications, usage, restrictions, recommendations, technical_info, cta_label, seo_title, seo_description, seo_og_image, video_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`, [productCountryId, language.id, body.translation.name ?? '', body.translation.shortDescription ?? null, body.translation.longDescription ?? null, body.translation.intro ?? null, body.translation.benefits ?? null, body.translation.applications ?? null, body.translation.usage ?? null, body.translation.restrictions ?? null, body.translation.recommendations ?? null, body.translation.technicalInfo ?? null, body.translation.ctaLabel ?? null, body.translation.seoTitle ?? null, body.translation.seoDescription ?? null, body.translation.seoOgImage ?? null, body.translation.videoUrl ?? null]);
        } else {
          await client.query(`UPDATE product_translation SET name = COALESCE($1, name), short_description = COALESCE($2, short_description), long_description = COALESCE($3, long_description), intro = COALESCE($4, intro), benefits = COALESCE($5, benefits), applications = COALESCE($6, applications), usage = COALESCE($7, usage), restrictions = COALESCE($8, restrictions), recommendations = COALESCE($9, recommendations), technical_info = COALESCE($10, technical_info), cta_label = COALESCE($11, cta_label), seo_title = COALESCE($12, seo_title), seo_description = COALESCE($13, seo_description), seo_og_image = COALESCE($14, seo_og_image), video_url = COALESCE($15, video_url) WHERE id = $16`, [body.translation.name ?? null, body.translation.shortDescription ?? null, body.translation.longDescription ?? null, body.translation.intro ?? null, body.translation.benefits ?? null, body.translation.applications ?? null, body.translation.usage ?? null, body.translation.restrictions ?? null, body.translation.recommendations ?? null, body.translation.technicalInfo ?? null, body.translation.ctaLabel ?? null, body.translation.seoTitle ?? null, body.translation.seoDescription ?? null, body.translation.seoOgImage ?? null, body.translation.videoUrl ?? null, existing.rows[0].id]);
        }
      }

      return resolveProductBundle(id, country.code, body.translation?.languageCode ?? 'es');
    });

    return Response.json({ data: result });
  } catch (error) {
    console.error('PUT /api/admin/products/[id] failed', error);
    return Response.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
