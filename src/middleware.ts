import { NextRequest, NextResponse } from "next/server";

import { AUTH_SESSION_COOKIE_NAME, canManageGlobalProducts, normalizeInternalRedirect, readAuthSession } from "@/lib/auth";

function buildLoginRedirect(request: NextRequest): NextResponse {
  const redirectUrl = new URL("/admin/login", request.url);
  redirectUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(redirectUrl);
}

function buildDefaultAdminRedirect(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL("/admin/products", request.url));
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;
  try {
    console.log('[MIDDLEWARE] url=', request.nextUrl.pathname, 'cookiePresent=', Boolean(token), 'cookieLen=', token ? token.length : 0);
  } catch (e) {
    // ignore logging errors
  }
  const session = await readAuthSession(token);
  try {
    console.log('[MIDDLEWARE] parsedSession=', session ? { userId: session.userId, role: session.role, exp: session.exp } : null);
  } catch (e) {
    // ignore logging errors
  }

  if (request.nextUrl.pathname === "/admin/login") {
    if (session) {
      const nextPath = normalizeInternalRedirect(request.nextUrl.searchParams.get("next"));
      return NextResponse.redirect(new URL(nextPath, request.url));
    }

    return NextResponse.next();
  }

  if (!session) {
    return buildLoginRedirect(request);
  }

  if (request.nextUrl.pathname.startsWith("/admin/products/new") && !canManageGlobalProducts(session.role)) {
    return buildDefaultAdminRedirect(request);
  }

  if (request.nextUrl.pathname === "/admin") {
    return buildDefaultAdminRedirect(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};