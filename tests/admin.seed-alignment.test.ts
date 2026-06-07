import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { resolve } from "node:path";

test("local smoke seed adds an EC product_country copy", () => {
  const migrationPath = resolve(process.cwd(), "db/migrations/010_add_ec_smoke_data.sql");
  const sql = readFileSync(migrationPath, "utf8");

  assert.match(sql, /code = 'ec'/);
  assert.match(sql, /replace\(v_ecommerce_url, '-pe\.', '-ec\.'\)/);
  assert.match(sql, /INSERT INTO product_translation/);
  assert.match(sql, /INSERT INTO product_image/);
});