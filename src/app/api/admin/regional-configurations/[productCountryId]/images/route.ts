import { NextRequest } from "next/server";
import sharp from "sharp";
import {
  AUTH_SESSION_COOKIE_NAME,
  canManageCountryImages,
  hasCountryAccess,
  readAuthSession,
} from "@/lib/auth.ts";
import { query } from "@/lib/db.ts";
import { buildProductImageUrl } from "@/lib/spaces-assets.ts";
import { uploadBufferToSpaces } from "@/lib/spaces-client.ts";
import {
  appendProductImagesToProductCountry,
  deleteProductImageForProduct,
  reorderProductImagesForPrimary,
} from "@/modules/product/product.repository.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ productCountryId: string }>;
};

type ImagesMutationBody = {
  action?: "promote" | "delete";
  imageId?: string;
};

function isValidUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && /^[0-9a-fA-F-]{36}$/.test(value);
}

function sanitizePathSegment(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "") || "product";
}

async function uploadImagesToAssets(params: {
  productCountryId: string;
  countryCode: string;
  slug: string;
  files: File[];
}) {
  const normalizedCountryCode = sanitizePathSegment(params.countryCode);
  const normalizedSlug = sanitizePathSegment(params.slug);

  const currentCountResult = await query<{ image_count: string }>(
    `SELECT COUNT(*)::int AS image_count
     FROM product_image
     WHERE product_country_id = $1`,
    [params.productCountryId],
  );

  const currentCount = Number(currentCountResult.rows[0]?.image_count ?? 0);
  const storedImages: Array<{ url: string; altText: string | null }> = [];

  for (const [index, file] of params.files.entries()) {
    const fileName = currentCount + index === 0
      ? "main.webp"
      : `gallery-${String(currentCount + index).padStart(2, "0")}.webp`;
    const objectKey = `products/${normalizedCountryCode}/${normalizedSlug}/${fileName}`;
    const publicUrl = buildProductImageUrl(normalizedCountryCode, normalizedSlug, fileName);
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await sharp(inputBuffer).rotate().webp({ quality: 88 }).toBuffer();

    await uploadBufferToSpaces({
      key: objectKey,
      contentType: "image/webp",
      body: outputBuffer,
    });

    storedImages.push({
      url: publicUrl,
      altText: file.name.replace(/\.[^.]+$/, "").trim() || null,
    });
  }

  return appendProductImagesToProductCountry(params.productCountryId, storedImages);
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await readAuthSession(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageCountryImages(session.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { productCountryId } = await context.params;
    if (!isValidUuid(productCountryId)) {
      return Response.json({ error: "Invalid productCountryId" }, { status: 400 });
    }

    // Resolve productCountryId → productId + countryCode + slug
    const pcRes = await query<{ product_id: string; country_code: string; slug: string }>(
      `SELECT pc.product_id, pc.slug, c.code AS country_code
       FROM product_country pc
       JOIN country c ON c.id = pc.country_id
       WHERE pc.id = $1
       LIMIT 1`,
      [productCountryId],
    );

    if (pcRes.rows.length === 0) return Response.json({ error: "Not found" }, { status: 404 });
    const { product_id: productId, country_code: countryCode, slug } = pcRes.rows[0];

    if (!hasCountryAccess(session, countryCode)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const action = String(formData.get("action") ?? "");

      if (action !== "upload") {
        return Response.json({ error: "Invalid action" }, { status: 400 });
      }

      const files = formData
        .getAll("files")
        .filter((entry): entry is File => entry instanceof File && entry.size > 0 && entry.type.startsWith("image/"));

      if (files.length === 0) {
        return Response.json({ error: "No valid image files were provided" }, { status: 400 });
      }

      const images = await uploadImagesToAssets({
        productCountryId,
        countryCode,
        slug,
        files,
      });

      return Response.json({ data: { images } });
    }

    let body: ImagesMutationBody;
    try {
      body = (await request.json()) as ImagesMutationBody;
    } catch {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!body.action || !isValidUuid(body.imageId)) {
      return Response.json({ error: "Missing or invalid action or imageId" }, { status: 400 });
    }

    if (body.action !== "promote" && body.action !== "delete") {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    const images =
      body.action === "promote"
        ? await reorderProductImagesForPrimary(productId, countryCode, body.imageId)
        : await deleteProductImageForProduct(productId, countryCode, body.imageId);

    if (!images) {
      return Response.json({ error: "Image not found" }, { status: 404 });
    }

    return Response.json({ data: { images } });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Missing required Spaces env var")) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.error(
      "POST /api/admin/regional-configurations/[productCountryId]/images failed",
      error,
    );
    return Response.json({ error: "Failed to update images" }, { status: 500 });
  }
}
