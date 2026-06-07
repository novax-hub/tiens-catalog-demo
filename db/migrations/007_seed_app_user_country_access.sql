-- Seed country access for local test users.
-- SUPER_ADMIN is intentionally not assigned here; the app should treat that role as global access.
BEGIN;

CREATE TABLE IF NOT EXISTS app_user_country_access (
    user_id UUID NOT NULL,
    country_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, country_id),
    CONSTRAINT fk_auca_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    CONSTRAINT fk_auca_country FOREIGN KEY (country_id) REFERENCES country(id) ON DELETE CASCADE
);

INSERT INTO app_user_country_access (user_id, country_id, is_active, created_at, updated_at)
SELECT u.id, c.id, TRUE, now(), now()
FROM app_user u
JOIN country c ON c.code = 'pe'
WHERE u.email IN ('admin.pe@local.test', 'editor.pe@local.test', 'assistant.pe@local.test')
ON CONFLICT (user_id, country_id) DO UPDATE
SET is_active = EXCLUDED.is_active,
    updated_at = now();

INSERT INTO app_user_country_access (user_id, country_id, is_active, created_at, updated_at)
SELECT u.id, c.id, TRUE, now(), now()
FROM app_user u
JOIN country c ON c.code = 'ec'
WHERE u.email IN ('admin.ec@local.test', 'editor.ec@local.test', 'assistant.ec@local.test')
ON CONFLICT (user_id, country_id) DO UPDATE
SET is_active = EXCLUDED.is_active,
    updated_at = now();

COMMIT;
