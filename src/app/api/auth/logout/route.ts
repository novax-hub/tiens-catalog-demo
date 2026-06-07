import { NextRequest, NextResponse } from "next/server";

import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth";

function buildLogoutResponse(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.set({
    name: AUTH_SESSION_COOKIE_NAME,
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
  });
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return buildLogoutResponse(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return buildLogoutResponse(request);
}