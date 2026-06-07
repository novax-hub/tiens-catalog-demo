CREATE OR REPLACE FUNCTION can_user_access_country(
    p_user_id UUID,
    p_country_code VARCHAR,
    p_action VARCHAR DEFAULT 'view'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_role VARCHAR(20);
    v_allowed BOOLEAN;
BEGIN
    SELECT role
    INTO v_role
    FROM app_user
    WHERE id = p_user_id
      AND is_active = TRUE;

    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;

    IF v_role = 'SUPER_ADMIN' THEN
        RETURN TRUE;
    END IF;

    IF p_action NOT IN ('view', 'edit') THEN
        RETURN FALSE;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM app_user_country_access a
        JOIN country c ON c.id = a.country_id
        WHERE a.user_id = p_user_id
          AND a.is_active = TRUE
          AND c.code = p_country_code
    )
    INTO v_allowed;

    IF NOT v_allowed THEN
        RETURN FALSE;
    END IF;

    IF p_action = 'view' THEN
        RETURN TRUE;
    END IF;

    RETURN v_role IN ('ADMIN', 'EDITOR');
END;
$$;
