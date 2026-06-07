export function parseEcommerceExternalId(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const params = new URLSearchParams(parsedUrl.search);

    if (params.has("id")) return params.get("id");
    if (params.has("s")) return params.get("s");
  } catch {
    // ignore invalid urls and continue with fragment parsing
  }

  try {
    const hashIndex = url.indexOf("#");
    if (hashIndex === -1) return null;

    const fragment = url.slice(hashIndex + 1);
    const queryIndex = fragment.indexOf("?");
    if (queryIndex === -1) return null;

    const params = new URLSearchParams(fragment.slice(queryIndex + 1));
    if (params.has("id")) return params.get("id");
    if (params.has("s")) return params.get("s");
  } catch {
    // ignore invalid fragments
  }

  return null;
}