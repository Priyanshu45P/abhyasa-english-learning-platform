import dotenv from "dotenv";
dotenv.config();
function required(name) {
    const value = process.env[name];
    if (!value || value.trim() === "") {
        throw new Error(`Missing env var: ${name}`);
    }
    return value;
}
export const env = {
    PORT: Number(process.env.PORT ?? "4000"),
    NODE_ENV: process.env.NODE_ENV ?? "development",
    JWT_SECRET: required("JWT_SECRET"),
    DATABASE_URL: required("DATABASE_URL"),
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
};
