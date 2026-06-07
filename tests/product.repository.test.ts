import assert from "node:assert/strict";
import { test } from "node:test";
import { getProductById, getProductsCatalog } from "../src/modules/product/product.service.ts";
import { query } from "../src/lib/db.ts";

test("catalog endpoint resolves PE data when another country has no local content", async () => {
  const response = await getProductsCatalog({ country: "ec", lang: "es" });

  assert.equal(response.meta.resolvedCountry, "ec");
  assert.equal(response.meta.resolvedLanguage, "es");
  assert.equal(response.data.length, 10);
  assert.equal(response.data[0]?.country, "pe");
  assert.equal(response.data[0]?.isFallbackCountry, true);
});

test("product detail endpoint returns images and translation data", async () => {
  const productResult = await query<{ id: string }>(
    `SELECT id FROM product WHERE sku = $1 LIMIT 1`,
    ["F17"],
  );

  assert.ok(productResult.rows[0]?.id);

  const response = await getProductById(productResult.rows[0].id, {
    country: "pe",
    lang: "es",
  });

  assert.ok(response);
  assert.equal(response?.data.sku, "F17");
  assert.equal(response?.data.country, "pe");
  assert.ok(response?.data.images.length ?? 0 > 0);
  assert.ok(response?.data.name.length ?? 0 > 0);
});