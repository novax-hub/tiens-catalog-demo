import { query, withTransaction } from "@/lib/db.ts";
import type { AuthRole } from "@/lib/auth";
import type { AdminUserDetail, AdminUserListItem, AdminUserMutationInput } from "./admin-user.types.ts";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: Date | string | null;
  last_login_at: Date | string | null;
  country_codes: string[] | null;
};

type CountryRow = {
  id: string;
  code: string;
};

function normalizeCountryCodes(countryCodes: string[]): string[] {
  return [...new Set(countryCodes.map((code) => code.trim().toLowerCase()).filter(Boolean))];
}

async function resolveCountriesByCodes(client: { query: typeof query }, countryCodes: string[]): Promise<CountryRow[]> {
  const normalized = normalizeCountryCodes(countryCodes);
  if (normalized.length === 0) return [];

  const result = await client.query<CountryRow>(
    `SELECT id, code
     FROM country
     WHERE lower(code) = ANY($1)
       AND is_active = TRUE
     ORDER BY code ASC`,
    [normalized],
  );

  if (result.rows.length !== normalized.length) {
    throw new Error("Invalid country codes");
  }

  return result.rows;
}

function mapUserRow(row: UserRow): AdminUserListItem {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
    countryCodes: row.country_codes ?? [],
  };
}

async function getAdminUserByIdWithClient(
  client: { query: typeof query },
  userId: string,
): Promise<AdminUserDetail | null> {
  const result = await client.query<UserRow>(
    `SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        u.last_login_at,
        COALESCE(
          array_agg(c.code ORDER BY c.code) FILTER (WHERE c.code IS NOT NULL),
          '{}'::text[]
        ) AS country_codes
     FROM app_user u
     LEFT JOIN app_user_country_access auca
            ON auca.user_id = u.id
           AND auca.is_active = TRUE
     LEFT JOIN country c ON c.id = auca.country_id
     WHERE u.id = $1
     GROUP BY u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.last_login_at
     LIMIT 1`,
    [userId],
  );

  return result.rows[0] ? mapUserRow(result.rows[0]) : null;
}

/**
 * Lists users for admin backoffice.
 *
 * - allowedCountryCodes: pass null for SUPER_ADMIN (returns all users).
 *   Pass a non-empty array for ADMIN (returns only users who have at least one
 *   country assignment matching the allowed set).
 *
 * This is the data foundation for PR 8 (user management module).
 * The full user management UI — create, activate, assign countries — is out of scope for PR 2.
 */
export async function listAdminUsers(options: {
  allowedCountryCodes: string[] | null;
}): Promise<AdminUserListItem[]> {
  const baseSql = `
    SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        u.last_login_at,
        COALESCE(
          array_agg(c.code ORDER BY c.code) FILTER (WHERE c.code IS NOT NULL),
          '{}'::text[]
        ) AS country_codes
     FROM app_user u
     LEFT JOIN app_user_country_access auca
            ON auca.user_id = u.id
           AND auca.is_active = TRUE
     LEFT JOIN country c ON c.id = auca.country_id`;

  let sql = baseSql;
  const params: unknown[] = [];

  if (options.allowedCountryCodes !== null) {
    const normalized = options.allowedCountryCodes.map((code) => code.toLowerCase());
    sql += `
     WHERE EXISTS (
       SELECT 1
       FROM app_user_country_access auca2
       JOIN country c2 ON c2.id = auca2.country_id
       WHERE auca2.user_id = u.id
         AND auca2.is_active = TRUE
         AND lower(c2.code) = ANY($1)
     )
       AND u.role IN ('EDITOR', 'ASSISTANT')
       AND NOT EXISTS (
         SELECT 1
         FROM app_user_country_access auca3
         JOIN country c3 ON c3.id = auca3.country_id
         WHERE auca3.user_id = u.id
           AND auca3.is_active = TRUE
           AND NOT (lower(c3.code) = ANY($1))
       )`;
    params.push(normalized);
  }

  sql += `
     GROUP BY u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.last_login_at
     ORDER BY u.role ASC, u.name ASC`;

  const result = await query<UserRow>(sql, params);

  return result.rows.map(mapUserRow);
}

export async function findAdminUserById(userId: string): Promise<AdminUserDetail | null> {
  return getAdminUserByIdWithClient({ query }, userId);
}

export async function createAdminUser(input: AdminUserMutationInput): Promise<AdminUserDetail> {
  return withTransaction(async (client) => {
    const emailCheck = await client.query<{ id: string }>(
      `SELECT id FROM app_user WHERE lower(email) = lower($1) LIMIT 1`,
      [input.email],
    );

    if (emailCheck.rows.length > 0) {
      throw Object.assign(new Error("Email already exists"), { status: 409 });
    }

    const countries = input.role === "SUPER_ADMIN"
      ? []
      : await resolveCountriesByCodes(client, input.countryCodes);

    if (input.role !== "SUPER_ADMIN" && countries.length === 0) {
      throw Object.assign(new Error("Country assignment is required"), { status: 400 });
    }

    const insertResult = await client.query<{ id: string }>(
      `INSERT INTO app_user (name, email, password, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [input.name.trim(), input.email.trim().toLowerCase(), input.passwordHash ?? "", input.role, input.isActive],
    );

    const userId = insertResult.rows[0].id;

    if (countries.length > 0) {
      for (const country of countries) {
        await client.query(
          `INSERT INTO app_user_country_access (user_id, country_id, is_active)
           VALUES ($1, $2, TRUE)`,
          [userId, country.id],
        );
      }
    }

    const created = await getAdminUserByIdWithClient(client, userId);
    if (!created) {
      throw new Error("Failed to load created user");
    }

    return created;
  });
}

export async function updateAdminUser(
  userId: string,
  input: Partial<AdminUserMutationInput>,
): Promise<AdminUserDetail | null> {
  return withTransaction(async (client) => {
    const current = await client.query<{ id: string; role: AuthRole }>(
      `SELECT id, role FROM app_user WHERE id = $1 LIMIT 1`,
      [userId],
    );

    if (current.rows.length === 0) {
      return null;
    }

    if (input.email !== undefined) {
      const emailCheck = await client.query<{ id: string }>(
        `SELECT id FROM app_user WHERE lower(email) = lower($1) AND id <> $2 LIMIT 1`,
        [input.email, userId],
      );
      if (emailCheck.rows.length > 0) {
        throw Object.assign(new Error("Email already exists"), { status: 409 });
      }
    }

    if (input.countryCodes !== undefined && input.role === "SUPER_ADMIN") {
      await client.query(`DELETE FROM app_user_country_access WHERE user_id = $1`, [userId]);
    }

    if (input.countryCodes !== undefined && input.role !== "SUPER_ADMIN") {
      const countries = await resolveCountriesByCodes(client, input.countryCodes);
      if (countries.length === 0) {
        throw Object.assign(new Error("Country assignment is required"), { status: 400 });
      }

      await client.query(`DELETE FROM app_user_country_access WHERE user_id = $1`, [userId]);
      for (const country of countries) {
        await client.query(
          `INSERT INTO app_user_country_access (user_id, country_id, is_active)
           VALUES ($1, $2, TRUE)`,
          [userId, country.id],
        );
      }
    }

    const updateParts: string[] = [];
    const params: unknown[] = [];

    if (input.name !== undefined) {
      params.push(input.name.trim());
      updateParts.push(`name = $${params.length}`);
    }
    if (input.email !== undefined) {
      params.push(input.email.trim().toLowerCase());
      updateParts.push(`email = $${params.length}`);
    }
    if (input.role !== undefined) {
      params.push(input.role);
      updateParts.push(`role = $${params.length}`);
    }
    if (input.isActive !== undefined) {
      params.push(input.isActive);
      updateParts.push(`is_active = $${params.length}`);
    }
    if (input.passwordHash !== undefined) {
      params.push(input.passwordHash);
      updateParts.push(`password = $${params.length}`);
    }

    if (updateParts.length > 0) {
      params.push(userId);
      await client.query(
        `UPDATE app_user
         SET ${updateParts.join(", ")}, updated_at = NOW()
         WHERE id = $${params.length}`,
        params,
      );
    }

    const updated = await getAdminUserByIdWithClient(client, userId);
    return updated;
  });
}
