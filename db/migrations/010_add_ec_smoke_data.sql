-- Migration 010: add minimal EC smoke data for QA and role validation.
-- This clones one PE regional configuration into EC so local seeds can exercise
-- multi-country navigation and authorization without changing the main mock.

DO $$
DECLARE
    v_product_id UUID;
    v_source_pc_id UUID;
    v_target_pc_id UUID;
    v_language_id UUID;
    v_slug VARCHAR(180);
    v_price NUMERIC(10,2);
    v_currency VARCHAR(10);
    v_ecommerce_url TEXT;
    v_ecommerce_external_id VARCHAR(120);
    v_is_active BOOLEAN;
    v_published_at TIMESTAMP;
    v_name VARCHAR(255);
    v_short_description TEXT;
    v_long_description TEXT;
    v_intro TEXT;
    v_benefits JSONB;
    v_applications JSONB;
    v_usage JSONB;
    v_restrictions JSONB;
    v_recommendations JSONB;
    v_technical_info JSONB;
    v_cta_label VARCHAR(100);
    v_seo_title VARCHAR(255);
    v_seo_description TEXT;
    v_seo_og_image TEXT;
    v_video_url TEXT;
BEGIN
    SELECT
        p.id,
        pc.id,
        pt.language_id,
        pc.slug,
        pc.price,
        pc.currency,
        pc.ecommerce_url,
        pc.ecommerce_external_id,
        pc.is_active,
        pc.published_at,
        pt.name,
        pt.short_description,
        pt.long_description,
        pt.intro,
        pt.benefits,
        pt.applications,
        pt.usage,
        pt.restrictions,
        pt.recommendations,
        pt.technical_info,
        pt.cta_label,
        pt.seo_title,
        pt.seo_description,
        pt.seo_og_image,
        pt.video_url
    INTO
        v_product_id,
        v_source_pc_id,
        v_language_id,
        v_slug,
        v_price,
        v_currency,
        v_ecommerce_url,
        v_ecommerce_external_id,
        v_is_active,
        v_published_at,
        v_name,
        v_short_description,
        v_long_description,
        v_intro,
        v_benefits,
        v_applications,
        v_usage,
        v_restrictions,
        v_recommendations,
        v_technical_info,
        v_cta_label,
        v_seo_title,
        v_seo_description,
        v_seo_og_image,
        v_video_url
    FROM product p
    JOIN product_country pc ON pc.product_id = p.id
    JOIN country c ON c.id = pc.country_id
    JOIN product_translation pt ON pt.product_country_id = pc.id
    JOIN language l ON l.id = pt.language_id
    WHERE p.sku = 'F17'
      AND c.code = 'pe'
      AND lower(l.code) = 'es'
    LIMIT 1;

    IF v_product_id IS NULL THEN
        RAISE NOTICE 'Skipping EC smoke data because the PE source product is missing.';
    ELSE
        SELECT pc.id
        INTO v_target_pc_id
        FROM product_country pc
        JOIN country c ON c.id = pc.country_id
        WHERE pc.product_id = v_product_id
          AND c.code = 'ec'
        LIMIT 1;

        IF v_target_pc_id IS NULL THEN
            INSERT INTO product_country (
                id,
                product_id,
                country_id,
                slug,
                price,
                currency,
                ecommerce_url,
                ecommerce_external_id,
                is_active,
                published_at,
                created_at,
                updated_at
            )
            SELECT
                uuid_generate_v4(),
                v_product_id,
                c.id,
                v_slug || '-ec',
                v_price,
                v_currency,
                replace(v_ecommerce_url, '-pe.', '-ec.'),
                v_ecommerce_external_id,
                v_is_active,
                v_published_at,
                now(),
                now()
            FROM country c
            WHERE c.code = 'ec'
            RETURNING id INTO v_target_pc_id;
        END IF;

        INSERT INTO product_translation (
            id,
            product_country_id,
            language_id,
            name,
            short_description,
            long_description,
            intro,
            benefits,
            applications,
            usage,
            restrictions,
            recommendations,
            technical_info,
            cta_label,
            seo_title,
            seo_description,
            seo_og_image,
            video_url
        )
        SELECT
            uuid_generate_v4(),
            v_target_pc_id,
            v_language_id,
            v_name,
            v_short_description,
            v_long_description,
            v_intro,
            v_benefits,
            v_applications,
            v_usage,
            v_restrictions,
            v_recommendations,
            v_technical_info,
            v_cta_label,
            v_seo_title,
            v_seo_description,
            v_seo_og_image,
            v_video_url
        WHERE NOT EXISTS (
            SELECT 1
            FROM product_translation existing
            WHERE existing.product_country_id = v_target_pc_id
              AND existing.language_id = v_language_id
        );

        INSERT INTO product_image (
            id,
            product_country_id,
            url,
            sort_order,
            alt_text,
            is_primary,
            created_at
        )
        SELECT
            uuid_generate_v4(),
            v_target_pc_id,
            replace(pi.url, '/pe/', '/ec/'),
            pi.sort_order,
            pi.alt_text,
            pi.is_primary,
            now()
        FROM product_image pi
        WHERE pi.product_country_id = v_source_pc_id
          AND NOT EXISTS (
              SELECT 1
              FROM product_image existing
              WHERE existing.product_country_id = v_target_pc_id
                AND existing.sort_order = pi.sort_order
          );
    END IF;
END $$;