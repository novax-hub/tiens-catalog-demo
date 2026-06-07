import { loadDevEnv } from "@/lib/env";
import type {
  ProductCatalogResponse,
  ProductDetailResponse,
  ProductSummary,
} from "@/modules/product/product.types.ts";

loadDevEnv();

function getSiteUrl() {
  const explicitSiteUrl = process.env.SITE_URL?.trim();

  if (explicitSiteUrl) {
    return explicitSiteUrl.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

function buildApiUrl(pathname: string, searchParams?: Record<string, string | undefined>) {
  const url = new URL(pathname, getSiteUrl());

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url.pathname}: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function getCatalogProducts(country: string, lang = "es") {
  return fetchJson<ProductCatalogResponse>(buildApiUrl("/api/products", { country, lang }));
}

export async function getCatalogProductDetailBySlug(country: string, slug: string, lang = "es") {
  const catalog = await getCatalogProducts(country, lang);
  const summary = catalog.data.find((product) => product.slug === slug);

  if (!summary) {
    return null;
  }

  const detail = await fetchJson<ProductDetailResponse>(buildApiUrl(`/api/products/${summary.id}`, { country, lang }));

  return {
    catalog,
    summary,
    detail,
  };
}

export async function getCatalogProductDetailById(productId: string, country: string, lang = "es") {
  return fetchJson<ProductDetailResponse>(buildApiUrl(`/api/products/${productId}`, { country, lang }));
}

export function getPrimaryImage(summary: ProductSummary) {
  return summary.heroImage;
}