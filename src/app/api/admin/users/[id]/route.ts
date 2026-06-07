import { NextRequest } from "next/server";

import { AUTH_SESSION_COOKIE_NAME, canManageUsers, readAuthSession } from "@/lib/auth";
import { canAccessAdminUser } from "@/modules/user/admin-user-access.ts";
import { findAdminUserById, updateAdminUser } from "@/modules/user/admin-user.repository.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UpdateUserBody = {
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  countryCodes?: string[];
};

function normalizeCountryCodes(countryCodes: string[] | undefined): string[] {
  if (!Array.isArray(countryCodes)) return [];
  return [...new Set(countryCodes.map((code) => code.trim().toLowerCase()).filter(Boolean))];
}

function isAllowedRoleForSession(sessionRole: string, targetRole: string): boolean {
  if (sessionRole === "SUPER_ADMIN") return true;
  if (sessionRole === "ADMIN") {
    return targetRole === "EDITOR" || targetRole === "ASSISTANT";
  }
  return false;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(session.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  if (!id) return Response.json({ error: "Missing user id" }, { status: 400 });

  const current = await findAdminUserById(id);
  if (!current) return Response.json({ error: "Not found" }, { status: 404 });

  if (!canAccessAdminUser(session, current)) {
    return Response.json({ error: "Forbidden: user is outside your scope" }, { status: 403 });
  }

  let body: UpdateUserBody;
  try {
    body = (await request.json()) as UpdateUserBody;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updates: {
    name?: string;
    email?: string;
    role?: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "ASSISTANT";
    isActive?: boolean;
    countryCodes?: string[];
  } = {};

  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.email !== undefined) updates.email = body.email.trim().toLowerCase();
  if (body.isActive !== undefined) updates.isActive = body.isActive;
  if (body.role !== undefined) {
    if (!isAllowedRoleForSession(session.role, body.role)) {
      return Response.json({ error: "Forbidden: role not allowed for your scope" }, { status: 403 });
    }
    updates.role = body.role as "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "ASSISTANT";
  }

  if (body.countryCodes !== undefined) {
    const countryCodes = normalizeCountryCodes(body.countryCodes);
    if (session.role === "ADMIN") {
      const allowedSet = new Set(session.countryCodes.map((code) => code.toLowerCase()));
      if (countryCodes.length === 0) {
        return Response.json({ error: "Missing required country assignments" }, { status: 400 });
      }
      if (countryCodes.some((code) => !allowedSet.has(code))) {
        return Response.json({ error: "Forbidden: country not in your permissions" }, { status: 403 });
      }
    }
    updates.countryCodes = countryCodes;
  }

  if (session.role === "ADMIN") {
    if (updates.role && updates.role !== "EDITOR" && updates.role !== "ASSISTANT") {
      return Response.json({ error: "Forbidden: role not allowed for your scope" }, { status: 403 });
    }
  }

  const updated = await updateAdminUser(id, updates);
  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ data: updated });
}