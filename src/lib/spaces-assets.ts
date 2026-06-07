const DEFAULT_SPACES_CDN_URL = 'https://cdn.vivetiens.com';

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, '');

export const SPACES_CDN_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_SPACES_CDN_URL || DEFAULT_SPACES_CDN_URL
);

export function buildProductImageUrl(country: string, slug: string, imageName: string) {
  return `${SPACES_CDN_URL}/products/${country}/${slug}/${imageName}`;
}

export function buildProductGalleryUrls(country: string, slug: string, galleryImageCount: number) {
  return Array.from({ length: galleryImageCount }, (_, index) =>
    buildProductImageUrl(country, slug, `gallery-${String(index + 1).padStart(2, '0')}.webp`)
  );
}

export function buildProductAssetUrls(country: string, slug: string, imageCount: number) {
  if (imageCount <= 0) {
    return [];
  }

  return [
    buildProductImageUrl(country, slug, 'main.webp'),
    ...buildProductGalleryUrls(country, slug, imageCount - 1),
  ];
}

export function normalizeImageUrl(
  value: string,
  fallback?: { country: string; slug: string; imageIndex?: number }
) {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (fallback) {
    const imageName = fallback.imageIndex && fallback.imageIndex > 0
      ? `gallery-${String(fallback.imageIndex).padStart(2, '0')}.webp`
      : 'main.webp';

    return buildProductImageUrl(fallback.country, fallback.slug, imageName);
  }

  return value.startsWith('/') ? value : `/${value}`;
}