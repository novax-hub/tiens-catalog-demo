import { getProductById } from "../../../../modules/product/product.service.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: ProductRouteContext) {
  try {
    const { id } = await context.params;
    const searchParams = new URL(request.url).searchParams;
    const country = searchParams.get("country") ?? undefined;
    const lang = searchParams.get("lang") ?? undefined;

    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
      return Response.json(
        { error: "Invalid product id" },
        { status: 400 },
      );
    }

    const response = await getProductById(id, { country, lang });

    if (!response) {
      return Response.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    return Response.json(response);
  } catch (error) {
    console.error(`GET /api/products/[id] failed`, error);

    return Response.json(
      { error: "Failed to load product" },
      { status: 500 },
    );
  }
}