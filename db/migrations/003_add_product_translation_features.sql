BEGIN;

ALTER TABLE product_translation
  ADD COLUMN IF NOT EXISTS features JSONB;

COMMIT;
