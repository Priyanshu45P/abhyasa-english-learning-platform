import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, teacherOrAdmin } from "../middleware/auth.js";

export const vocabRouter = Router();

const Level = z.enum(["beginner", "intermediate", "advanced"]);

const CreateVocabListSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  level: Level,
});

const UpdateVocabListSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  level: Level,
});

const CreateVocabItemSchema = z.object({
  listId: z.string().min(1),
  word: z.string().trim().min(1),
  definition: z.string().trim().min(1),
  example: z.string().trim().min(1),
  phonetic: z.string().trim().min(1),
  level: Level,
});

const UpdateVocabItemSchema = z.object({
  word: z.string().trim().min(1),
  definition: z.string().trim().min(1),
  example: z.string().trim().min(1),
  phonetic: z.string().trim().min(1),
  level: Level,
});

vocabRouter.get("/lists", authRequired, async (_req, res, next) => {
  try {
    const lists = await prisma.vocabList.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json(lists);
  } catch (error) {
    return next(error);
  }
});

vocabRouter.get("/items", authRequired, async (_req, res, next) => {
  try {
    const items = await prisma.vocabItem.findMany({
      orderBy: { createdAt: "asc" },
    });

    return res.json(items);
  } catch (error) {
    return next(error);
  }
});

vocabRouter.post("/lists", authRequired, teacherOrAdmin, async (req, res, next) => {
  try {
    const input = CreateVocabListSchema.parse(req.body);

    const created = await prisma.vocabList.create({
      data: {
        name: input.name,
        description: input.description,
        level: input.level,
        teacherId: req.auth!.sub,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
});

vocabRouter.patch("/lists/:id", authRequired, teacherOrAdmin, async (req, res, next) => {
  try {
    const input = UpdateVocabListSchema.parse(req.body);

    const existing = await prisma.vocabList.findUnique({
      where: { id: req.params.id },
      select: { id: true, teacherId: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Vocabulary list not found" });
    }

    if (req.auth!.role !== "admin" && existing.teacherId !== req.auth!.sub) {
      return res
        .status(403)
        .json({ error: "You can only update your own vocabulary lists" });
    }

    const updated = await prisma.vocabList.update({
      where: { id: req.params.id },
      data: {
        name: input.name,
        description: input.description,
        level: input.level,
      },
    });

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

vocabRouter.post("/items", authRequired, teacherOrAdmin, async (req, res, next) => {
  try {
    const input = CreateVocabItemSchema.parse(req.body);

    const list = await prisma.vocabList.findUnique({
      where: { id: input.listId },
      select: { id: true, teacherId: true },
    });

    if (!list) {
      return res.status(404).json({ error: "Vocabulary list not found" });
    }

    if (req.auth!.role !== "admin" && list.teacherId !== req.auth!.sub) {
      return res
        .status(403)
        .json({ error: "You can only add items to your own vocabulary lists" });
    }

    const created = await prisma.vocabItem.create({
      data: {
        listId: input.listId,
        word: input.word,
        definition: input.definition,
        example: input.example,
        phonetic: input.phonetic,
        level: input.level,
        teacherId: req.auth!.sub,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
});

vocabRouter.patch("/items/:id", authRequired, teacherOrAdmin, async (req, res, next) => {
  try {
    const input = UpdateVocabItemSchema.parse(req.body);

    const existing = await prisma.vocabItem.findUnique({
      where: { id: req.params.id },
      include: {
        list: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Vocabulary item not found" });
    }

    if (req.auth!.role !== "admin" && existing.list.teacherId !== req.auth!.sub) {
      return res
        .status(403)
        .json({ error: "You can only update your own vocabulary items" });
    }

    const updated = await prisma.vocabItem.update({
      where: { id: req.params.id },
      data: {
        word: input.word,
        definition: input.definition,
        example: input.example,
        phonetic: input.phonetic,
        level: input.level,
      },
    });

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

vocabRouter.delete("/lists/:id", authRequired, teacherOrAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.vocabList.findUnique({
      where: { id: req.params.id },
      select: { id: true, teacherId: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Vocabulary list not found" });
    }

    if (req.auth!.role !== "admin" && existing.teacherId !== req.auth!.sub) {
      return res
        .status(403)
        .json({ error: "You can only delete your own vocabulary lists" });
    }

    await prisma.vocabList.delete({
      where: { id: req.params.id },
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

vocabRouter.delete("/items/:id", authRequired, teacherOrAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.vocabItem.findUnique({
      where: { id: req.params.id },
      include: {
        list: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Vocabulary item not found" });
    }

    if (req.auth!.role !== "admin" && existing.list.teacherId !== req.auth!.sub) {
      return res
        .status(403)
        .json({ error: "You can only delete your own vocabulary items" });
    }

    await prisma.vocabItem.delete({
      where: { id: req.params.id },
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});