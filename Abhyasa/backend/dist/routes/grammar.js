import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, teacherOrAdmin } from "../middleware/auth.js";
export const grammarRouter = Router();
const Level = z.enum(["beginner", "intermediate", "advanced"]);
const CreateGrammarSchema = z.object({
    title: z.string().trim().min(1),
    content: z.string().trim().min(1),
    level: Level,
    tags: z.array(z.string().trim().min(1)).default([]),
});
const UpdateGrammarLessonSchema = z.object({
    title: z.string().trim().min(1).optional(),
    content: z.string().trim().min(1).optional(),
    level: Level.optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
});
function formatGrammar(item) {
    return {
        id: item.id,
        title: item.title,
        content: item.content,
        level: item.level,
        teacherId: item.teacherId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        tags: item.tags.map((t) => t.tag.name),
    };
}
grammarRouter.get("/", authRequired, async (_req, res, next) => {
    try {
        const items = await prisma.grammarLesson.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                tags: {
                    include: { tag: true },
                },
            },
        });
        return res.json(items.map(formatGrammar));
    }
    catch (error) {
        return next(error);
    }
});
grammarRouter.get("/:id", authRequired, async (req, res, next) => {
    try {
        const item = await prisma.grammarLesson.findUnique({
            where: { id: req.params.id },
            include: {
                tags: {
                    include: { tag: true },
                },
            },
        });
        if (!item) {
            return res.status(404).json({ error: "Grammar lesson not found" });
        }
        return res.json(formatGrammar(item));
    }
    catch (error) {
        return next(error);
    }
});
grammarRouter.post("/", authRequired, teacherOrAdmin, async (req, res, next) => {
    try {
        const input = CreateGrammarSchema.parse(req.body);
        const created = await prisma.grammarLesson.create({
            data: {
                title: input.title,
                content: input.content,
                level: input.level,
                teacherId: req.auth.sub,
                tags: {
                    create: input.tags.map((name) => ({
                        tag: {
                            connectOrCreate: {
                                where: { name },
                                create: { name },
                            },
                        },
                    })),
                },
            },
            include: {
                tags: {
                    include: { tag: true },
                },
            },
        });
        return res.status(201).json(formatGrammar(created));
    }
    catch (error) {
        return next(error);
    }
});
grammarRouter.patch("/:id", authRequired, teacherOrAdmin, async (req, res, next) => {
    try {
        const input = UpdateGrammarLessonSchema.parse(req.body);
        const existing = await prisma.grammarLesson.findUnique({
            where: { id: req.params.id },
            include: {
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
        });
        if (!existing) {
            return res.status(404).json({ error: "Grammar lesson not found" });
        }
        if (req.auth.role !== "admin" && existing.teacherId !== req.auth.sub) {
            return res.status(403).json({ error: "You can only update your own grammar lessons" });
        }
        const nextTitle = input.title ?? existing.title;
        const nextContent = input.content ?? existing.content;
        const nextLevel = input.level ?? existing.level;
        const nextTags = input.tags ?? existing.tags.map((item) => item.tag.name);
        const updated = await prisma.$transaction(async (tx) => {
            await tx.grammarLesson.update({
                where: { id: req.params.id },
                data: {
                    title: nextTitle,
                    content: nextContent,
                    level: nextLevel,
                },
            });
            await tx.grammarLessonTag.deleteMany({
                where: {
                    grammarId: req.params.id,
                },
            });
            for (const rawTag of nextTags) {
                const tagName = rawTag.trim();
                if (!tagName)
                    continue;
                const tag = await tx.tag.upsert({
                    where: { name: tagName },
                    update: {},
                    create: { name: tagName },
                });
                await tx.grammarLessonTag.create({
                    data: {
                        grammarId: req.params.id,
                        tagId: tag.id,
                    },
                });
            }
            return tx.grammarLesson.findUnique({
                where: { id: req.params.id },
                include: {
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                },
            });
        });
        if (!updated) {
            return res.status(404).json({ error: "Grammar lesson not found after update" });
        }
        return res.json(formatGrammar(updated));
    }
    catch (error) {
        return next(error);
    }
});
grammarRouter.delete("/:id", authRequired, teacherOrAdmin, async (req, res, next) => {
    try {
        const existing = await prisma.grammarLesson.findUnique({
            where: { id: req.params.id },
            select: { id: true, teacherId: true },
        });
        if (!existing) {
            return res.status(404).json({ error: "Grammar lesson not found" });
        }
        if (req.auth.role !== "admin" && existing.teacherId !== req.auth.sub) {
            return res.status(403).json({ error: "You can only delete your own grammar lessons" });
        }
        await prisma.grammarLesson.delete({
            where: { id: req.params.id },
        });
        return res.status(204).send();
    }
    catch (error) {
        return next(error);
    }
});
