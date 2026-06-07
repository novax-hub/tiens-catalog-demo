ALTER TABLE app_user DROP CONSTRAINT IF EXISTS app_user_role_check;

ALTER TABLE app_user
    ADD CONSTRAINT app_user_role_check CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'ASSISTANT'));
