import { findCountryByCode, findLanguageByCode, resolveProductBundle, resolveProductCatalog } from "./product.repository.ts";
import { mapBundleToDetail, mapBundleToSummary } from "./product.mapper.ts";
import type { LocaleInput, LocaleResolution, ProductCatalogResponse, ProductDetailResponse } from "./product.types.ts";

const DEFAULT_COUNTRY_CODE = "pe";
const DEFAULT_LANGUAGE_CODE = "es";

function normalizeCode(value: string | undefined, fallback: string) {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (!/^[a-z]{2,5}$/.test(normalized)) {
    return fallback;
  }

  return normalized;
}

export async function resolveLocale(input: LocaleInput = {}): Promise<LocaleResolution> {
  const requestedCountry = normalizeCode(input.country, DEFAULT_COUNTRY_CODE);
  const requestedLanguage = normalizeCode(input.lang, DEFAULT_LANGUAGE_CODE);

  const [requestedCountryRow, fallbackCountryRow, requestedLanguageRow, fallbackLanguageRow] = await Promise.all([
    findCountryByCode(requestedCountry),
    findCountryByCode(DEFAULT_COUNTRY_CODE),
    findLanguageByCode(requestedLanguage),
    findLanguageByCode(DEFAULT_LANGUAGE_CODE),
  ]);

  const resolvedCountry = requestedCountryRow?.code ?? fallbackCountryRow?.code ?? DEFAULT_COUNTRY_CODE;
  const resolvedLanguage = requestedLanguageRow?.code ?? fallbackLanguageRow?.code ?? DEFAULT_LANGUAGE_CODE;

  return {
    requestedCountry,
    requestedLanguage,
    resolvedCountry,
    resolvedLanguage,
    countryFallback: resolvedCountry !== requestedCountry,
    languageFallback: resolvedLanguage !== requestedLanguage,
  };
}

export async function getProductsCatalog(input: LocaleInput = {}): Promise<ProductCatalogResponse> {
  const locale = await resolveLocale(input);
  const bundles = await resolveProductCatalog(locale.requestedCountry, locale.resolvedLanguage);

  return {
    meta: {
      requestedCountry: locale.requestedCountry,
      requestedLanguage: locale.requestedLanguage,
      resolvedCountry: locale.resolvedCountry,
      resolvedLanguage: locale.resolvedLanguage,
      countryFallback: locale.countryFallback,
      languageFallback: locale.languageFallback,
      count: bundles.length,
    },
    data: bundles.map((bundle) => mapBundleToSummary(bundle)),
  };
}

export async function getProductById(productId: string, input: LocaleInput = {}): Promise<ProductDetailResponse | null> {
  const locale = await resolveLocale(input);
  const bundle = await resolveProductBundle(productId, locale.requestedCountry, locale.resolvedLanguage);

  if (!bundle) {
    return null;
  }

  return {
    meta: {
      requestedCountry: locale.requestedCountry,
      requestedLanguage: locale.requestedLanguage,
      resolvedCountry: locale.resolvedCountry,
      resolvedLanguage: locale.resolvedLanguage,
      countryFallback: locale.countryFallback,
      languageFallback: locale.languageFallback,
    },
    data: mapBundleToDetail(bundle),
  };
}

export { normalizeCode };