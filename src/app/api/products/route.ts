import type { NextRequest } from "next/server";
import { getProductsCatalog } from "../../../modules/product/product.service.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country") ?? undefined;
    const lang = searchParams.get("lang") ?? undefined;

    const response = await getProductsCatalog({ country, lang });

    return Response.json(response);
  } catch (error) {
    console.error("GET /api/products failed", error);

    return Response.json(
      { error: "Failed to load products" },
      { status: 500 },
    );
  }
}