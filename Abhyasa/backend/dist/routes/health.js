import { Router } from "express";
import { prisma } from "../lib/prisma.js";
export const healthRouter = Router();
healthRouter.get("/", async (_req, res, next) => {
    try {
        await prisma.user.count();
        return res.json({
            ok: true,
            service: "learning-platform-backend",
            database: "connected",
        });
    }
    catch (error) {
        return next(error);
    }
});
