import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const mockPath = path.join(repoRoot, 'mock-data', 'catalog.fase1.mock.json');

function loadEnv() {
  const file = path.join(repoRoot, '.env.dev');
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const i = s.indexOf('=');
    if (i === -1) continue;
    const k = s.slice(0, i);
    const v = s.slice(i + 1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnv();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'tiens_catalog_dev',
  user: process.env.DB_USER || 'tiens_app',
  password: process.env.DB_PASSWORD || '',
});

const CDN = (process.env.NEXT_PUBLIC_SPACES_CDN_URL || 'https://tiens-assets-staging.nyc3.cdn.digitaloceanspaces.com').replace(/\/$/, '');
const COUNTRY_ASSET_PREFIX = 'products';

function safeJson(v) {
  return v == null ? null : JSON.stringify(v);
}

function buildProductAssetUrl(countryCode, productSlug, fileName) {
  return `${CDN}/${COUNTRY_ASSET_PREFIX}/${countryCode}/${productSlug}/${fileName}`;
}

function resolveProductSlug(product, countryData) {
  return countryData?.slug || product.slug || product.sku.toLowerCase();
}

async function upsertCountry(code) {
  function currencyFor(code) {
    const m = {
      pe: 'PEN',
      ec: 'USD',
      bo: 'BOB',
      co: 'COP',
      mx: 'MXN',
    };
    return m[String(code).toLowerCase()] || 'USD';
  }
  const res = await client.query(
    `INSERT INTO country (id, code, name, currency_code, is_active, created_at) VALUES (uuid_generate_v4(), $1, $2, $3, TRUE, now()) ON CONFLICT (code) DO NOTHING RETURNING id;`,
    [code, code.toUpperCase(), currencyFor(code)],
  );
  if (res.rowCount) return res.rows[0].id;
  const r2 = await client.query(`SELECT id FROM country WHERE code = $1 LIMIT 1`, [code]);
  return r2.rows[0].id;
}

async function upsertLanguage(code) {
  const res = await client.query(
    `INSERT INTO language (id, code, name, is_active) VALUES (uuid_generate_v4(), $1, $2, TRUE) ON CONFLICT (code) DO NOTHING RETURNING id;`,
    [code, code.toUpperCase()],
  );
  if (res.rowCount) return res.rows[0].id;
  const r2 = await client.query(`SELECT id FROM language WHERE code = $1 LIMIT 1`, [code]);
  return r2.rows[0].id;
}

async function importProduct(p) {
  // upsert product
  await client.query('BEGIN');
  try {
    const prodRes = await client.query(
      `INSERT INTO product (id, sku, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, now(), now())
       ON CONFLICT (sku) DO UPDATE SET is_active = EXCLUDED.is_active, updated_at = now()
       RETURNING id;`,
      [p.id, p.sku, p.isActive === true],
    );
    const productId = prodRes.rows[0].id;

    for (const [countryCode, cdata] of Object.entries(p.countries || {})) {
      const countryId = await upsertCountry(countryCode);
      const productSlug = resolveProductSlug(p, cdata);
      const productMainImageUrl = buildProductAssetUrl(countryCode, productSlug, 'main.webp');
      const primaryTranslation = Object.values(cdata.translations || {})[0] || null;
      // upsert product_country
      const pcRes = await client.query(
        `INSERT INTO product_country (id, product_id, country_id, slug, price, currency, ecommerce_url, ecommerce_external_id, is_active, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, now(), now())
         ON CONFLICT (product_id, country_id) DO UPDATE SET slug = EXCLUDED.slug, price = EXCLUDED.price, currency = EXCLUDED.currency, ecommerce_url = EXCLUDED.ecommerce_url, updated_at = now()
         RETURNING id;`,
        [productId, countryId, productSlug || null, cdata.price?.amount ?? null, cdata.price?.currency ?? null, cdata.ecommerceUrl || `https://example.com/products/${p.sku}`, cdata.ecommerceExternalId ?? null, cdata.isActive === true],
      );
      const productCountryId = pcRes.rows[0].id;

      // translations -> include `features` JSONB and prefix seo og image
      for (const [langCode, t] of Object.entries(cdata.translations || {})) {
        const langId = await upsertLanguage(langCode);
        const features = {};
        if (t.benefits) features.benefits = t.benefits;
        if (t.applications) features.applications = t.applications;
        if (t.usage) features.usage = t.usage;
        if (t.restrictions) features.restrictions = t.restrictions;
        if (t.recommendations) features.recommendations = t.recommendations;
        if (t.technicalInfo) features.technicalInfo = t.technicalInfo;

        const seoOg = productMainImageUrl;

        await client.query(
          `INSERT INTO product_translation (id, product_country_id, language_id, name, short_description, long_description, intro, benefits, applications, usage, restrictions, recommendations, technical_info, features, cta_label, seo_title, seo_description, seo_og_image, video_url)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          ON CONFLICT (product_country_id, language_id) DO UPDATE SET
            name = EXCLUDED.name,
            short_description = EXCLUDED.short_description,
            long_description = EXCLUDED.long_description,
            intro = EXCLUDED.intro,
            benefits = EXCLUDED.benefits,
            applications = EXCLUDED.applications,
            usage = EXCLUDED.usage,
            restrictions = EXCLUDED.restrictions,
            recommendations = EXCLUDED.recommendations,
            technical_info = EXCLUDED.technical_info,
            features = EXCLUDED.features,
            cta_label = EXCLUDED.cta_label,
            seo_title = EXCLUDED.seo_title,
            seo_description = EXCLUDED.seo_description,
            seo_og_image = EXCLUDED.seo_og_image,
            video_url = EXCLUDED.video_url;`,
          [productCountryId, langId, t.name || null, t.shortDescription || null, t.longDescription || null, t.intro || null, safeJson(t.benefits), safeJson(t.applications), safeJson(t.usage), safeJson(t.restrictions), safeJson(t.recommendations), safeJson(t.technicalInfo), safeJson(Object.keys(features).length ? features : null), t.ctaLabel || null, t.seo?.title || null, t.seo?.description || null, seoOg, t.videoUrl || null],
        );
      }

      // images -> follow bucket convention: main.webp + gallery-xx.webp
      await client.query(`DELETE FROM product_image WHERE product_country_id = $1`, [productCountryId]);
      const rawImages = [].concat(cdata.images || []).filter(Boolean);
      for (let i = 0; i < rawImages.length; i++) {
        const fileName = i === 0 ? 'main.webp' : `gallery-${String(i).padStart(2, '0')}.webp`;
        const url = buildProductAssetUrl(countryCode, productSlug, fileName);
        await client.query(
          `INSERT INTO product_image (id, product_country_id, url, sort_order, alt_text, is_primary, created_at) VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, now())`,
          [productCountryId, url, i, primaryTranslation?.name || null, i === 0],
        );
      }
    }

    await client.query('COMMIT');
    console.log(`imported product ${p.sku}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('failed product', p.sku, err.message);
  }
}

async function run() {
  if (!fs.existsSync(mockPath)) {
    console.error('mock not found at', mockPath);
    process.exit(1);
  }

  let raw = fs.readFileSync(mockPath, 'utf8');
  // strip UTF-8 BOM if present
  raw = raw.replace(/^\uFEFF/, '');
  const data = JSON.parse(raw);

  await client.connect();

  // ensure countries and languages
  for (const c of data.availableCountries || []) await upsertCountry(c);
  for (const l of data.availableLanguages || []) await upsertLanguage(l);

  // import first N products by default (safe subset)
  const limit = Number(process.env.IMPORT_LIMIT || 10);
  const products = (data.products || []).slice(0, limit);
  console.log(`importing ${products.length} products (limit ${limit})`);

  for (const p of products) {
    await importProduct(p);
  }

  await client.end();
  console.log('done');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('import_mock.mjs')) {
  run().catch((err) => { console.error(err); process.exit(1); });
}
