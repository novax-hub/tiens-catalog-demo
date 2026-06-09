export type AuthRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "ASSISTANT";

export type AuthSession = {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
  role: AuthRole;
  countryCodes: string[];
  exp: number;
};

export const AUTH_SESSION_COOKIE_NAME = "tiens_auth_session";
export const AUTH_SESSION_TTL_SECONDS = 60 * 60 * 8;

const AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET ?? "tiens-catalog-local-session-secret";

// Fail fast in production when the secret is not configured.
if (process.env.NODE_ENV === "production" && AUTH_SESSION_SECRET === "tiens-catalog-local-session-secret") {
  // Throwing here prevents the app from starting with an insecure fallback secret.
  throw new Error("AUTH_SESSION_SECRET is not set in production. Set the AUTH_SESSION_SECRET environment variable in your hosting provider.");
}
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64url");
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(padded, "base64"));
  }

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function importSessionKey(): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(AUTH_SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signPayload(payload: string): Promise<string> {
  const key = await importSessionKey();
  const signature = await globalThis.crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifyPayload(payload: string, signature: string): Promise<boolean> {
  const key = await importSessionKey();
  const signatureBytes = base64UrlToBytes(signature);
  return globalThis.crypto.subtle.verify("HMAC", key, signatureBytes as unknown as BufferSource, encoder.encode(payload));
}

export function isAuthRole(role: string): role is AuthRole {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "EDITOR" || role === "ASSISTANT";
}

export function canRoleEdit(role: AuthRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "EDITOR";
}

export function isSuperAdmin(role: AuthRole): boolean {
  return role === "SUPER_ADMIN";
}

export function canViewCountryProducts(role: AuthRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "EDITOR" || role === "ASSISTANT";
}

export function canEditCountryProduct(role: AuthRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "EDITOR";
}

export function canEditCountrySeo(role: AuthRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "EDITOR";
}

export function canManageCountryImages(role: AuthRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "EDITOR";
}

export function canToggleCountryProductActivation(role: AuthRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function canManageGlobalProducts(role: AuthRole): boolean {
  return role === "SUPER_ADMIN";
}

export function canManageUsers(role: AuthRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function hasCountryAccess(session: Pick<AuthSession, "role" | "countryCodes">, countryCode: string | null | undefined): boolean {
  if (session.role === "SUPER_ADMIN") {
    return true;
  }

  const normalizedCountryCode = countryCode?.trim().toLowerCase();
  if (!normalizedCountryCode) {
    return false;
  }

  return session.countryCodes.some((value) => value.toLowerCase() === normalizedCountryCode);
}

export function normalizeInternalRedirect(target: string | null | undefined, fallback = "/admin/products"): string {
  const trimmedTarget = typeof target === "string" ? target.trim() : "";

  if (!trimmedTarget || !trimmedTarget.startsWith("/") || trimmedTarget.startsWith("//") || trimmedTarget.includes("\\")) {
    return fallback;
  }

  return trimmedTarget;
}

export async function createAuthSession(session: Omit<AuthSession, "exp"> & { exp?: number }): Promise<string> {
  const payload: AuthSession = {
    ...session,
    exp: session.exp ?? Math.floor(Date.now() / 1000) + AUTH_SESSION_TTL_SECONDS,
  };
  const encodedPayload = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function parseAuthSession(token: string | null | undefined): Promise<AuthSession | null> {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const isValid = await verifyPayload(encodedPayload, signature);
  console.log(
    "[AUTH]",
    {
      hasToken: !!token,
      payloadLength: encodedPayload.length,
      signatureLength: signature.length,
      isValid,
    }
  );
  if (!isValid) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(decoder.decode(base64UrlToBytes(encodedPayload)));
  } catch {
    return null;
  }

  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const candidate = payload as Partial<AuthSession>;
  if (
    typeof candidate.sessionId !== "string" ||
    typeof candidate.userId !== "string" ||
    typeof candidate.email !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.role !== "string" ||
    !isAuthRole(candidate.role) ||
    !Array.isArray(candidate.countryCodes) ||
    candidate.countryCodes.some((countryCode) => typeof countryCode !== "string") ||
    typeof candidate.exp !== "number"
  ) {
    return null;
  }

  if (candidate.exp * 1000 <= Date.now()) {
    return null;
  }

  return {
    sessionId: candidate.sessionId,
    userId: candidate.userId,
    email: candidate.email,
    name: candidate.name,
    role: candidate.role,
    countryCodes: candidate.countryCodes,
    exp: candidate.exp,
  };
}

export async function readAuthSession(token: string | null | undefined): Promise<AuthSession | null> {
  return parseAuthSession(token);
}

export function buildLoginRedirectUrl(requestUrl: string, nextPath: string, error: string): URL {
  const redirectUrl = new URL("/admin/login", requestUrl);
  redirectUrl.searchParams.set("next", normalizeInternalRedirect(nextPath));
  redirectUrl.searchParams.set("error", error);
  return redirectUrl;
}