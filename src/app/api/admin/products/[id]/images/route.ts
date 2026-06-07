import { NextRequest } from "next/server";
import { AUTH_SESSION_COOKIE_NAME, canManageCountryImages, hasCountryAccess, readAuthSession } from "@/lib/auth.ts";
import { deleteProductImageForProduct, reorderProductImagesForPrimary } from "@/modules/product/product.repository.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductImagesRouteContext = {
  params: Promise<{ id: string }>;
};

type ProductImagesMutationBody = {
  action?: "promote" | "delete";
  countryCode?: string;
  imageId?: string;
};

function isValidUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && /^[0-9a-fA-F-]{36}$/.test(value);
}

function isValidCountryCode(value: string | null | undefined): value is string {
  return typeof value === "string" && /^[a-z]{2,5}$/i.test(value);
}

export async function POST(request: NextRequest, context: ProductImagesRouteContext) {
  try {
    const session = await readAuthSession(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageCountryImages(session.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    if (!isValidUuid(id)) {
      return Response.json({ error: "Invalid product id" }, { status: 400 });
    }

    let body: ProductImagesMutationBody;
    try {
      body = (await request.json()) as ProductImagesMutationBody;
    } catch {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!body.action || !isValidCountryCode(body.countryCode) || !isValidUuid(body.imageId)) {
      return Response.json({ error: "Missing or invalid image mutation data" }, { status: 400 });
    }

    if (!hasCountryAccess(session, body.countryCode)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const images = body.action === "promote"
      ? await reorderProductImagesForPrimary(id, body.countryCode, body.imageId)
      : await deleteProductImageForProduct(id, body.countryCode, body.imageId);

    if (!images) {
      return Response.json({ error: "Image not found" }, { status: 404 });
    }

    return Response.json({
      data: {
        images,
      },
    });
  } catch (error) {
    console.error(`POST /api/admin/products/[id]/images failed`, error);

    return Response.json({ error: "Failed to update product images" }, { status: 500 });
  }
}