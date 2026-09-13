import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}
// Create PostgreSQL connection pool using DATABASE_URL.
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});
/// Prisma adapter connects Prisma with PostgreSQL.
const adapter = new PrismaPg(pool);

export const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}