/**
 * Prisma client singleton.
 * Prisma 7 requires a driver adapter; we use @prisma/adapter-mariadb (compatible with MySQL).
 * We parse DATABASE_URL and pass a config object to avoid mariadb driver URL parsing issues.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function parseDatabaseUrl(url: string): { host: string; port: number; user: string; password: string; database: string } {
  const trimmed = url.trim();
  // Normalize mysql:// or mariadb:// so the URL constructor can parse it
  const normalized = trimmed.replace(/^(mysql|mariadb):\/\//i, "https://");
  const u = new URL(normalized);
  return {
    host: u.hostname,
    port: u.port ? Number.parseInt(u.port, 10) : 3306,
    user: decodeURIComponent(u.username || ""),
    password: decodeURIComponent(u.password || ""),
    database: u.pathname.replace(/^\//, "").replace(/\/$/, "") || "",
  };
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const config = parseDatabaseUrl(url);
  // Cap connections PER serverless instance. On Vercel each instance keeps its
  // own pool, so the mariadb default (10) × fan-out blows past the DB's
  // max_connections under load (load test: `pool timeout … active=0 idle=0
  // limit=10`). Keep this low for serverless; raise the DB's max_connections to
  // give headroom. Tune without a code change via DB_CONNECTION_LIMIT.
  const connectionLimit = Number(process.env.DB_CONNECTION_LIMIT) || 3;
  // connectTimeout = how long to open the TCP socket to the DB. The mariadb
  // driver default is a razor-thin 1000ms. On Vercel each serverless instance
  // owns its pool and is frozen between requests, so a cold/refrozen instance
  // must open a FRESH socket across the public internet to the DB on the next
  // hit. Any RTT jitter pushing that handshake past 1s threw "failed to create
  // socket after 1000ms" → pool empty (active=0 idle=0) → 500, intermittently
  // ("works one second, fails the next"). 10s is huge headroom over the real
  // ~50ms RTT yet still fails fast on a genuine outage. acquireTimeout (wait for
  // a pool slot) must stay >= connectTimeout, else the pool clamps connectTimeout
  // down to it (mariadb pool-options). Both tunable via env without a redeploy.
  const connectTimeout = Number(process.env.DB_CONNECT_TIMEOUT_MS) || 10000;
  const acquireTimeout = Number(process.env.DB_ACQUIRE_TIMEOUT_MS) || 15000;
  const adapter = new PrismaMariaDb({
    ...config,
    connectionLimit,
    connectTimeout,
    acquireTimeout,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
