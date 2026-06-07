import assert from "node:assert/strict";
import { test } from "node:test";

import { parseEcommerceExternalId } from "../src/lib/ecommerce.ts";

test("parseEcommerceExternalId reads ids from normal query params", () => {
  assert.equal(
    parseEcommerceExternalId("https://example.com/product?id=SKU-123"),
    "SKU-123",
  );
});

test("parseEcommerceExternalId reads ids from fragment query params", () => {
  assert.equal(
    parseEcommerceExternalId("https://h5-hwyd-pe.jikeint.com/#/?s=X43ojSLVNCi5"),
    "X43ojSLVNCi5",
  );
});

test("parseEcommerceExternalId returns null when url has no supported params", () => {
  assert.equal(parseEcommerceExternalId("https://example.com/product"), null);
  assert.equal(parseEcommerceExternalId(null), null);
});