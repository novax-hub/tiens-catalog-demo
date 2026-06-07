import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = process.cwd();
const inputPath = resolve(rootDir, 'src/mock-data/catalog.fase1.mock.json');
const outputPath = resolve(rootDir, 'db/migrations/002_seed_from_mock.sql');

const source = readFileSync(inputPath, 'utf8');
const catalog = JSON.parse(source);

const SPACES_CDN_URL = (process.env.NEXT_PUBLIC_SPACES_CDN_URL || 'https://tiens-assets-staging.nyc3.cdn.digitaloceanspaces.com').replace(/\/$/, '');

const countries = [
  { code: 'pe', name: 'Perú', currency: 'PEN' },
  { code: 'ec', name: 'Ecuador', currency: 'USD' },
  { code: 'bo', name: 'Bolivia', currency: 'BOB' },
  { code: 'co', name: 'Colombia', currency: 'COP' },
  { code: 'mx', name: 'México', currency: 'MXN' },
  { code: 'br', name: 'Brasil', currency: 'BRL' },
  { code: 'ar', name: 'Argentina', currency: 'ARS' },
  { code: 'pa', name: 'Panamá', currency: 'PAB' },
  { code: 'us', name: 'Estados Unidos', currency: 'USD' },
  { code: 've', name: 'Venezuela', currency: 'VES' },
];

const languages = [
  { code: 'es', name: 'Español' },
];

function sqlString(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlJson(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  return `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
}

function buildInsert(table, columns, rows) {
  if (rows.length === 0) {
    return '';
  }

  const header = `INSERT INTO ${table} (${columns.join(', ')})\nVALUES\n`;
  const body = rows
    .map((row) => `  (${row.join(', ')})`)
    .join(',\n');

  return `${header}${body};\n\n`;
}

function buildProductAssetUrl(countryCode, productSlug, fileName) {
  return `${SPACES_CDN_URL}/products/${countryCode}/${productSlug}/${fileName}`;
}

const sqlParts = [];
sqlParts.push('-- Seed generado desde src/mock-data/catalog.fase1.mock.json\n');
sqlParts.push('BEGIN;\n\n');

sqlParts.push(buildInsert(
  'country',
  ['code', 'name', 'currency_code', 'is_active'],
  countries.map((country) => [
    sqlString(country.code),
    sqlString(country.name),
    sqlString(country.currency),
    'TRUE',
  ])
));

sqlParts.push(buildInsert(
  'language',
  ['code', 'name', 'is_active'],
  languages.map((language) => [
    sqlString(language.code),
    sqlString(language.name),
    'TRUE',
  ])
));

const products = Array.isArray(catalog.products) ? catalog.products : [];

function parseEcommerceExternalId(url) {
  if (!url) return null;
  try {
    // Try to parse normal query params
    const u = new URL(url);
    const params = new URLSearchParams(u.search);
    if (params.has('id')) return params.get('id');
    if (params.has('s')) return params.get('s');
  } catch (err) {
    // URL constructor may fail for fragment-containing urls with hash query
  }

  // Try to extract from hash/query inside fragment (e.g. /#/?s=XXX)
  try {
    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1) {
      const fragment = url.slice(hashIndex + 1);
      const qIndex = fragment.indexOf('?');
      if (qIndex !== -1) {
        const qs = fragment.slice(qIndex + 1);
        const params = new URLSearchParams(qs);
        if (params.has('id')) return params.get('id');
        if (params.has('s')) return params.get('s');
      }
    }
  } catch (err) {
    // ignore
  }

  return null;
}

sqlParts.push(buildInsert(
  'product',
  ['id', 'sku', 'is_active'],
  products.map((product) => [
    sqlString(product.id),
    sqlString(product.sku),
    product.isActive ? 'TRUE' : 'FALSE',
  ])
));

const perCountryRows = [];
const translationRows = [];
const imageRows = [];

for (const product of products) {
  const perCountry = product.countries?.pe;
  if (!perCountry || !perCountry.isActive) {
    continue;
  }

  const productCountryId = randomUUID();
  const productCountrySlug = perCountry.slug ?? product.slug;
  const productCountryImageBase = buildProductAssetUrl('pe', productCountrySlug, 'main.webp');

  // derive ecommerceExternalId from ecommerceUrl when missing
  const derivedEcomId = perCountry.ecommerceExternalId ?? parseEcommerceExternalId(perCountry.ecommerceUrl);

  perCountryRows.push([
    sqlString(productCountryId),
    sqlString(product.id),
    `(SELECT id FROM country WHERE code = 'pe')`,
    sqlString(productCountrySlug),
    Number(perCountry.price?.amount ?? 0).toFixed(2),
    sqlString(perCountry.price?.currency ?? 'PEN'),
    sqlString(perCountry.ecommerceUrl),
    sqlString(derivedEcomId),
    'TRUE',
    'NOW()',
    'NOW()',
    'NOW()',
  ]);

  const translation = perCountry.translations?.es;
  if (translation) {
    const features = {};
    if (translation.benefits) features.benefits = translation.benefits;
    if (translation.applications) features.applications = translation.applications;
    if (translation.usage) features.usage = translation.usage;
    if (translation.restrictions) features.restrictions = translation.restrictions;
    if (translation.recommendations) features.recommendations = translation.recommendations;
    if (translation.technicalInfo) features.technicalInfo = translation.technicalInfo;
    translationRows.push([
      sqlString(randomUUID()),
      sqlString(productCountryId),
      `(SELECT id FROM language WHERE code = 'es')`,
      sqlString(translation.name),
      sqlString(translation.shortDescription),
      sqlString(translation.longDescription),
      sqlString(translation.intro),
      sqlJson(translation.benefits),
      sqlJson(translation.applications),
      sqlJson(translation.usage),
      sqlJson(translation.restrictions),
      sqlJson(translation.recommendations),
      sqlJson(translation.technicalInfo),
      sqlJson(Object.keys(features).length ? features : null),
      sqlString(translation.ctaLabel),
      sqlString(translation.seo?.title),
      sqlString(translation.seo?.description),
      sqlString(productCountryImageBase),
      sqlString(perCountry.videoUrl ?? translation.videoUrl),
    ]);
  }

  const images = Array.isArray(perCountry.images) ? perCountry.images : [];
  images.forEach((_, index) => {
    const fileName = index === 0
      ? 'main.webp'
      : `gallery-${String(index).padStart(2, '0')}.webp`;

    imageRows.push([
      sqlString(randomUUID()),
      sqlString(productCountryId),
      sqlString(buildProductAssetUrl('pe', productCountrySlug, fileName)),
      String(index),
      sqlString(index === 0 ? translation?.name ?? product.slug : `${translation?.name ?? product.slug} ${index + 1}`),
      index === 0 ? 'TRUE' : 'FALSE',
      'NOW()',
    ]);
  });
}

if (perCountryRows.length > 0) {
  sqlParts.push('INSERT INTO product_country (id, product_id, country_id, slug, price, currency, ecommerce_url, ecommerce_external_id, is_active, published_at, created_at, updated_at)\nVALUES\n');
  sqlParts.push(
    perCountryRows
      .map((row) => `  (${row.join(', ')})`)
      .join(',\n')
  );
  sqlParts.push(';\n\n');
}

if (translationRows.length > 0) {
  sqlParts.push('INSERT INTO product_translation (id, product_country_id, language_id, name, short_description, long_description, intro, benefits, applications, usage, restrictions, recommendations, technical_info, features, cta_label, seo_title, seo_description, seo_og_image, video_url)\nVALUES\n');
  sqlParts.push(
    translationRows
      .map((row) => `  (${row.join(', ')})`)
      .join(',\n')
  );
  sqlParts.push(';\n\n');
}

if (imageRows.length > 0) {
  sqlParts.push('INSERT INTO product_image (id, product_country_id, url, sort_order, alt_text, is_primary, created_at)\nVALUES\n');
  sqlParts.push(
    imageRows
      .map((row) => `  (${row.join(', ')})`)
      .join(',\n')
  );
  sqlParts.push(';\n\n');
}

sqlParts.push('COMMIT;\n');

writeFileSync(outputPath, sqlParts.join(''), 'utf8');
console.log(`Seed SQL generated at ${outputPath}`);
