import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeCode } from "../src/modules/product/product.service.ts";

test("normalizeCode keeps valid lowercase locale codes", () => {
  assert.equal(normalizeCode("pe", "pe"), "pe");
  assert.equal(normalizeCode("ES", "pe"), "es");
});

test("normalizeCode falls back for empty or invalid input", () => {
  assert.equal(normalizeCode("", "pe"), "pe");
  assert.equal(normalizeCode("   ", "pe"), "pe");
  assert.equal(normalizeCode("pe-1", "pe"), "pe");
});