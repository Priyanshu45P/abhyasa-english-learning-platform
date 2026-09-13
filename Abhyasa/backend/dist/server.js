import { createApp } from "./app.js";
import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";
const app = createApp();
async function bootstrap() {
    try {
        await prisma.$connect();
        const server = app.listen(env.PORT, () => {
            console.log(`API listening on http://localhost:${env.PORT}`);
        });
        const shutdown = async (signal) => {
            console.log(`${signal} received. Shutting down gracefully...`);
            server.close(async () => {
                try {
                    await prisma.$disconnect();
                    console.log("Server closed and database disconnected.");
                    process.exit(0);
                }
                catch (error) {
                    console.error("Error during shutdown", error);
                    process.exit(1);
                }
            });
        };
        process.on("SIGINT", () => {
            void shutdown("SIGINT");
        });
        process.on("SIGTERM", () => {
            void shutdown("SIGTERM");
        });
    }
    catch (error) {
        console.error("Failed to start server", error);
        process.exit(1);
    }
}
void bootstrap();
