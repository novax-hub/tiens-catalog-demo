import { NextRequest } from "next/server";
import { AUTH_SESSION_COOKIE_NAME, canManageGlobalProducts, readAuthSession } from "@/lib/auth.ts";
import { query } from "@/lib/db.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreatePayload = {
  sku: string;
  name: string;
  isActive?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const session = await readAuthSession(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);

    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!canManageGlobalProducts(session.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    let body: CreatePayload;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid body' }, { status: 400 });
    }

    if (!body?.sku?.trim() || !body?.name?.trim()) {
      return Response.json({ error: 'SKU y Nombre son requeridos' }, { status: 400 });
    }

    const result = await query<{ id: string }>(
      `INSERT INTO product (sku, name, is_active) VALUES ($1, $2, $3) RETURNING id`,
      [body.sku.trim().toUpperCase(), body.name.trim(), body.isActive ?? true],
    );

    return Response.json({ data: { id: result.rows[0].id } }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return Response.json({ error: 'Ya existe un producto con ese SKU' }, { status: 409 });
    }
    console.error('POST /api/admin/products failed', error);
    return Response.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

