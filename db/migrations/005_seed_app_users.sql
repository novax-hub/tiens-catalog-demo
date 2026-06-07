-- Seed example app users for local testing.
-- Passwords are documented in src/docs/usuarios-prueba-local.md.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH seed_users (name, email, plain_password, role) AS (
    VALUES
        ('Super Admin', 'super@local.test', 'Super2026!', 'SUPER_ADMIN'),
        ('Admin Perú', 'admin.pe@local.test', 'AdminPe2026!', 'ADMIN'),
        ('Admin Ecuador', 'admin.ec@local.test', 'AdminEc2026!', 'ADMIN'),
        ('Editor Perú', 'editor.pe@local.test', 'EditorPe2026!', 'EDITOR'),
        ('Editor Ecuador', 'editor.ec@local.test', 'EditorEc2026!', 'EDITOR'),
        ('Assistant Perú', 'assistant.pe@local.test', 'AssistantPe2026!', 'ASSISTANT'),
        ('Assistant Ecuador', 'assistant.ec@local.test', 'AssistantEc2026!', 'ASSISTANT')
)
INSERT INTO app_user (id, name, email, password, role, is_active, created_at, updated_at)
SELECT
    uuid_generate_v4(),
    seed_users.name,
    seed_users.email,
    crypt(seed_users.plain_password, gen_salt('bf')),
    seed_users.role,
    TRUE,
    now(),
    now()
FROM seed_users
ON CONFLICT (email) DO UPDATE
SET
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = now();

COMMIT;
