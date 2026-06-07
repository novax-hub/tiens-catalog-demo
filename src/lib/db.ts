import { Pool, type PoolClient, type PoolConfig, type QueryResultRow } from "pg";
import { loadDevEnv } from "./env.ts";

loadDevEnv();

declare global {
  // eslint-disable-next-line no-var
  var __tiensCatalogPool: Pool | undefined;
}

function buildPoolConfig(): PoolConfig {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
    };
  }

  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "tiens_catalog_dev",
    user: process.env.DB_USER || "tiens_app",
    password: process.env.DB_PASSWORD || "",
  };
}

const pool = globalThis.__tiensCatalogPool ?? new Pool(buildPoolConfig());

if (process.env.NODE_ENV !== "production") {
  globalThis.__tiensCatalogPool = pool;
}

export { pool };

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  return pool.query<T>(text, params);
}

export async function withTransaction<T>(runner: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await runner(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}