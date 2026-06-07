import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { query } from "@/lib/db";
import {
  AUTH_SESSION_COOKIE_NAME,
  AUTH_SESSION_TTL_SECONDS,
  buildLoginRedirectUrl,
  createAuthSession,
  normalizeInternalRedirect,
} from "@/lib/auth";

type LoginBody = {
  email?: string;
  password?: string;
  redirectTo?: string;
};

function isJsonRequest(request: NextRequest): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.includes("application/json");
}

async function readLoginBody(request: NextRequest): Promise<LoginBody> {
  if (isJsonRequest(request)) {
    return (await request.json()) as LoginBody;
  }

  const formData = await request.formData();
  return {
    email: formData.get("email")?.toString(),
    password: formData.get("password")?.toString(),
    redirectTo: formData.get("redirectTo")?.toString(),
  };
}

function redirectWithError(request: NextRequest, error: string, redirectTo: string): NextResponse {
  return NextResponse.redirect(buildLoginRedirectUrl(request.url, redirectTo, error));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await readLoginBody(request);
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const redirectTo = normalizeInternalRedirect(body.redirectTo);

  if (!email || !password) {
    return redirectWithError(request, "missing_credentials", redirectTo);
  }

  const userResult = await query(
    `
      SELECT id, name, email, password, role, is_active
      FROM app_user
      WHERE lower(email) = lower($1)
      LIMIT 1
    `,
    [email],
  );

  if (userResult.rowCount === 0) {
    return redirectWithError(request, "invalid_credentials", redirectTo);
  }

  const user = userResult.rows[0];

  if (!user.is_active) {
    return redirectWithError(request, "inactive_account", redirectTo);
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return redirectWithError(request, "invalid_credentials", redirectTo);
  }

  const countryResult = await query(
    `
      SELECT c.code
      FROM app_user_country_access a
      JOIN country c ON c.id = a.country_id
      WHERE a.user_id = $1
        AND a.is_active = TRUE
      ORDER BY c.code ASC
    `,
    [user.id],
  );

  await query(
    `
      UPDATE app_user
      SET last_login_at = now(), updated_at = now()
      WHERE id = $1
    `,
    [user.id],
  );

  const token = await createAuthSession({
    sessionId: crypto.randomUUID(),
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    countryCodes: countryResult.rows.map((row) => row.code),
  });

  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  response.cookies.set({
    name: AUTH_SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_SESSION_TTL_SECONDS,
  });

  return response;
}