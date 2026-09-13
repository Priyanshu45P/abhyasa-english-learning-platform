import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { env } from "./env.js";
const { Pool } = pg;
const pool = new Pool({
    connectionString: env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
export const prisma = global.__prisma ??
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
if (process.env.NODE_ENV !== "production") {
    global.__prisma = prisma;
}
