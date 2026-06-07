import { NextRequest } from "next/server";
import {
  AUTH_SESSION_COOKIE_NAME,
  canManageGlobalProducts,
  hasCountryAccess,
  readAuthSession,
} from "@/lib/auth.ts";
import { withTransaction } from "@/lib/db.ts";
import { findCountryByCode, findLanguageByCode } from "@/modules/product/product.repository.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AddCountryBody = {
  countryCode: string;
  languageCode: string;
  slug: string;
  price: number;
  currency: string;
  translationName?: string;
  ecommerceUrl?: string;
};

/**
 * POST /api/admin/products/:id/countries
 *
 * Creates a new product_country + initial product_translation in a single atomic transaction.
 * Returns 409 Conflict if the country is already configured for this product.
 * Only SUPER_ADMIN can call this endpoint.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await readAuthSession(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const isSuperAdmin = canManageGlobalProducts(session.role);
    const isAdmin = session.role === "ADMIN";

    if (!isSuperAdmin && !isAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: productId } = await context.params;
    if (!productId) return Response.json({ error: "Missing product id" }, { status: 400 });

    let body: AddCountryBody;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid body" }, { status: 400 });
    }

    const { countryCode, languageCode, slug, price, currency, translationName, ecommerceUrl } = body;

    if (!countryCode || !languageCode || !slug || price == null || !currency) {
      return Response.json({ error: "Missing required fields: countryCode, languageCode, slug, price, currency" }, { status: 400 });
    }

    if (typeof price !== "number" || price < 0) {
      return Response.json({ error: "price must be a non-negative number" }, { status: 400 });
    }

    // ADMIN can only create configs for their own assigned countries
    if (isAdmin && !hasCountryAccess(session, countryCode)) {
      return Response.json({ error: "Forbidden: country not in your permissions" }, { status: 403 });
    }

    const [country, language] = await Promise.all([
      findCountryByCode(countryCode),
      findLanguageByCode(languageCode),
    ]);

    if (!country) return Response.json({ error: "Invalid country code" }, { status: 422 });
    if (!language) return Response.json({ error: "Invalid language code" }, { status: 422 });

    const result = await withTransaction(async (client) => {
      // Check product exists
      const productCheck = await client.query(
        `SELECT id FROM product WHERE id = $1 LIMIT 1`,
        [productId],
      );
      if (productCheck.rows.length === 0) {
        throw Object.assign(new Error("Product not found"), { status: 404 });
      }

      // Guard against duplicate country for this product
      const duplicate = await client.query(
        `SELECT id FROM product_country WHERE product_id = $1 AND country_id = $2 LIMIT 1`,
        [productId, country.id],
      );
      if (duplicate.rows.length > 0) {
        throw Object.assign(
          new Error(`Country '${countryCode.toUpperCase()}' is already configured for this product`),
          { status: 409 },
        );
      }

      // Insert product_country
      const pcInsert = await client.query<{ id: string }>(
        `INSERT INTO product_country
           (product_id, country_id, slug, price, currency, ecommerce_url, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)
         RETURNING id`,
        [productId, country.id, slug.trim(), price, currency.toUpperCase(), (ecommerceUrl ?? "").trim()],
      );
      const productCountryId = pcInsert.rows[0].id;

      // Insert initial product_translation
      await client.query(
        `INSERT INTO product_translation
           (product_country_id, language_id, name)
         VALUES ($1, $2, $3)`,
        [productCountryId, language.id, (translationName ?? "").trim()],
      );

      return { productCountryId, countryCode: country.code, languageCode: language.code };
    });

    return Response.json({ data: result }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    const status = err.status ?? 500;
    const message = err.message ?? "Failed to add country";

    if (status < 500) {
      return Response.json({ error: message }, { status });
    }

    console.error("POST /api/admin/products/[id]/countries failed", error);
    return Response.json({ error: "Failed to add country" }, { status: 500 });
  }
}
