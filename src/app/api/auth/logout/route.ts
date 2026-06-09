import { NextRequest, NextResponse } from "next/server";

import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth";

function buildLogoutResponse(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isSecure = forwardedProto === "https" || process.env.VERCEL === "1";

  response.cookies.set({
    name: AUTH_SESSION_COOKIE_NAME,
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    expires: new Date(0),
  });
  return response;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return buildLogoutResponse(request);
}