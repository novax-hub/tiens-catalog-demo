import { NextRequest } from "next/server";
import {
  AUTH_SESSION_COOKIE_NAME,
  canEditCountryProduct,
  canToggleCountryProductActivation,
  hasCountryAccess,
  readAuthSession,
} from "@/lib/auth.ts";
import { query, withTransaction } from "@/lib/db.ts";
import { parseEcommerceExternalId } from "@/lib/ecommerce.ts";
import { findLanguageByCode } from "@/modules/product/product.repository.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegionalConfigUpdatePayload = {
  countryConfig?: {
    slug?: string;
    price?: number;
    currency?: string;
    ecommerceUrl?: string;
    isActive?: boolean;
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
    videoUrl?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    seoOgImage?: string | null;
  };
};

type RouteContext = {
  params: Promise<{ productCountryId: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await readAuthSession(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!canEditCountryProduct(session.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { productCountryId } = await context.params;
    if (!productCountryId) return Response.json({ error: "Missing productCountryId" }, { status: 400 });

    // Resolve product_country → country_code for access check
    const pcRes = await query<{ id: string; country_code: string }>(
      `SELECT pc.id, c.code AS country_code
       FROM product_country pc
       JOIN country c ON c.id = pc.country_id
       WHERE pc.id = $1
       LIMIT 1`,
      [productCountryId],
    );

    if (pcRes.rows.length === 0) return Response.json({ error: "Not found" }, { status: 404 });
    const { country_code: countryCode } = pcRes.rows[0];

    if (!hasCountryAccess(session, countryCode)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: RegionalConfigUpdatePayload;
    try {
      body = (await request.json()) as RegionalConfigUpdatePayload;
    } catch {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (body.countryConfig?.isActive !== undefined && !canToggleCountryProductActivation(session.role)) {
      return Response.json({ error: "Forbidden: cannot toggle regional activation" }, { status: 403 });
    }

    await withTransaction(async (client) => {
      // Update product_country
      if (body.countryConfig) {
        const cc = body.countryConfig;
        if (cc.ecommerceUrl !== undefined) {
          const ecommerceExternalId = parseEcommerceExternalId(cc.ecommerceUrl);
          await client.query(
            `UPDATE product_country
             SET slug                  = COALESCE($1, slug),
                 price                 = COALESCE($2, price),
                 currency              = COALESCE($3, currency),
                 ecommerce_url         = $4,
                 ecommerce_external_id = $5,
                 is_active             = COALESCE($6, is_active),
                 updated_at            = NOW()
             WHERE id = $7`,
            [
              cc.slug ?? null,
              cc.price ?? null,
              cc.currency ?? null,
              cc.ecommerceUrl,
              ecommerceExternalId,
              cc.isActive ?? null,
              productCountryId,
            ],
          );
        } else {
          await client.query(
            `UPDATE product_country
             SET slug      = COALESCE($1, slug),
                 price     = COALESCE($2, price),
                 currency  = COALESCE($3, currency),
                 is_active = COALESCE($4, is_active),
                 updated_at = NOW()
             WHERE id = $5`,
            [cc.slug ?? null, cc.price ?? null, cc.currency ?? null, cc.isActive ?? null, productCountryId],
          );
        }
      }

      // Upsert translation
      if (body.translation) {
        const t = body.translation;
        if (!t.languageCode) throw new Error("Missing languageCode in translation");

        const language = await findLanguageByCode(t.languageCode);
        if (!language) throw new Error("Invalid language code");

        const existing = await client.query<{ id: string }>(
          `SELECT id FROM product_translation WHERE product_country_id = $1 AND language_id = $2 LIMIT 1`,
          [productCountryId, language.id],
        );

        if (existing.rows.length === 0) {
          // INSERT — all text fields, cta_label stays null, features stays null
          await client.query(
            `INSERT INTO product_translation
               (product_country_id, language_id, name, short_description, long_description,
                intro, benefits, applications, usage, restrictions, recommendations,
                technical_info, cta_label, seo_title, seo_description, seo_og_image, video_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
            [
              productCountryId,
              language.id,
              t.name ?? "",
              t.shortDescription ?? null,
              t.longDescription ?? null,
              t.intro ?? null,
              t.benefits ?? null,
              t.applications ?? null,
              t.usage ?? null,
              t.restrictions ?? null,
              t.recommendations ?? null,
              t.technicalInfo ?? null,
              null, // cta_label
              t.seoTitle ?? null,
              t.seoDescription ?? null,
              t.seoOgImage ?? null,
              t.videoUrl ?? null,
            ],
          );
        } else {
          // UPDATE — full replacement of all editable fields
          await client.query(
            `UPDATE product_translation
             SET name              = $1,
                 short_description = $2,
                 long_description  = $3,
                 intro             = $4,
                 benefits          = $5,
                 applications      = $6,
                 usage             = $7,
                 restrictions      = $8,
                 recommendations   = $9,
                 technical_info    = $10,
                 seo_title         = $11,
                 seo_description   = $12,
                 seo_og_image      = $13,
                 video_url         = $14
             WHERE id = $15`,
            [
              t.name ?? "",
              t.shortDescription ?? null,
              t.longDescription ?? null,
              t.intro ?? null,
              t.benefits ?? null,
              t.applications ?? null,
              t.usage ?? null,
              t.restrictions ?? null,
              t.recommendations ?? null,
              t.technicalInfo ?? null,
              t.seoTitle ?? null,
              t.seoDescription ?? null,
              t.seoOgImage ?? null,
              t.videoUrl ?? null,
              existing.rows[0].id,
            ],
          );
        }
      }
    });

    return Response.json({ data: { ok: true } });
  } catch (error) {
    console.error("PUT /api/admin/regional-configurations/[productCountryId] failed", error);
    return Response.json({ error: "Failed to update regional configuration" }, { status: 500 });
  }
}
