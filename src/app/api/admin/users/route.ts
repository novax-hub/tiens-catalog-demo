import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

import { AUTH_SESSION_COOKIE_NAME, canManageUsers, readAuthSession } from "@/lib/auth";
import { listAdminUsers, createAdminUser } from "@/modules/user/admin-user.repository.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateUserBody = {
  name?: string;
  email?: string;
  password?: string;
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

export async function GET(request: NextRequest) {
  const session = await readAuthSession(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(session.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const allowedCountryCodes = session.role === "SUPER_ADMIN" ? null : session.countryCodes;
  const data = await listAdminUsers({ allowedCountryCodes });

  return Response.json({ data });
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(session.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: CreateUserBody;
  try {
    body = (await request.json()) as CreateUserBody;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const role = body.role?.trim() ?? "";
  const isActive = body.isActive ?? true;
  const countryCodes = normalizeCountryCodes(body.countryCodes);

  if (!name || !email || !password || !role) {
    return Response.json({ error: "Missing required fields: name, email, password, role" }, { status: 400 });
  }

  if (!isAllowedRoleForSession(session.role, role)) {
    return Response.json({ error: "Forbidden: role not allowed for your scope" }, { status: 403 });
  }

  if (session.role !== "SUPER_ADMIN") {
    const allowedSet = new Set(session.countryCodes.map((code) => code.toLowerCase()));
    if (countryCodes.length === 0) {
      return Response.json({ error: "Missing required country assignments" }, { status: 400 });
    }
    if (countryCodes.some((code) => !allowedSet.has(code))) {
      return Response.json({ error: "Forbidden: country not in your permissions" }, { status: 403 });
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await createAdminUser({
    name,
    email,
    role: role as "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "ASSISTANT",
    isActive,
    countryCodes,
    passwordHash,
  });

  return Response.json({ data: created }, { status: 201 });
}