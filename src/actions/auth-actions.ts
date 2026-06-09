"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth";

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_SESSION_COOKIE_NAME);
  redirect("/admin/login");
}
