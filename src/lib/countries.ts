export const SUPPORTED_COUNTRIES = ["pe", "ec", "bo", "co", "mx"] as const;

export type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];

export function isSupportedCountry(country: string): country is SupportedCountry {
  return SUPPORTED_COUNTRIES.includes(country as SupportedCountry);
}
