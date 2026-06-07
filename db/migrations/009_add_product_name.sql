-- Migration 009: Add name column to product table
-- The product table previously had no global name; names lived only in product_translation.
-- This adds a canonical display name at the product level, used by the admin backoffice
-- to identify products without requiring a country/language context.

ALTER TABLE product
    ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT '';

-- Back-fill from the first available Spanish translation for existing rows.
UPDATE product p
SET name = (
    SELECT pt.name
    FROM product_country pc
    JOIN product_translation pt ON pt.product_country_id = pc.id
    JOIN language            l  ON l.id = pt.language_id
    WHERE pc.product_id = p.id
      AND lower(l.code) = 'es'
    ORDER BY pc.created_at ASC
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1
    FROM product_country pc
    JOIN product_translation pt ON pt.product_country_id = pc.id
    JOIN language            l  ON l.id = pt.language_id
    WHERE pc.product_id = p.id
      AND lower(l.code) = 'es'
);
