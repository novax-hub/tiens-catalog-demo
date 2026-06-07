import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFile = path.resolve(__dirname, '..', '.env.dev');

function loadEnvFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(envFile);

const [,, emailArg, passwordArg, countryCodeArg, actionArg = 'view'] = process.argv;

if (!emailArg || !passwordArg || !countryCodeArg) {
  console.error('Usage: node scripts/verify-country-access-login.mjs <email> <password> <countryCode> [view|edit]');
  process.exit(1);
}

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function main() {
  await client.connect();

  const userResult = await client.query(
    `
      SELECT id, name, email, password, role, is_active
      FROM app_user
      WHERE email = $1
      LIMIT 1
    `,
    [emailArg],
  );

  if (userResult.rowCount === 0) {
    console.log(JSON.stringify({ ok: false, reason: 'user_not_found' }, null, 2));
    return;
  }

  const user = userResult.rows[0];

  if (!user.is_active) {
    console.log(JSON.stringify({ ok: false, reason: 'user_inactive', email: user.email }, null, 2));
    return;
  }

  const passwordMatches = await bcrypt.compare(passwordArg, user.password);
  if (!passwordMatches) {
    console.log(JSON.stringify({ ok: false, reason: 'invalid_password', email: user.email }, null, 2));
    return;
  }

  await client.query(
    `
      UPDATE app_user
      SET last_login_at = now(), updated_at = now()
      WHERE id = $1
    `,
    [user.id],
  );

  const accessResult = await client.query(
    `
      SELECT can_user_access_country($1, $2, $3) AS allowed
    `,
    [user.id, countryCodeArg, actionArg],
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        email: user.email,
        role: user.role,
        country: countryCodeArg,
        action: actionArg,
        allowed: accessResult.rows[0]?.allowed === true,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => {});
  });
