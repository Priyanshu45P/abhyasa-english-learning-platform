import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, teacherOrAdmin } from "../middleware/auth.js";

export const storiesRouter = Router();

const Level = z.enum(["beginner", "intermediate", "advanced"]);

const StoryVocabRefSchema = z.object({
  vocabItemId: z.string().trim().min(1),
  highlightText: z.string().trim().min(1),
});

const CreateStorySchema = z.object({
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  content: z.string().trim().min(1),
  level: Level,
  tags: z.array(z.string().trim().min(1)).default([]),
  grammarRefs: z.array(z.string().trim().min(1)).default([]),
  vocabRefs: z.array(StoryVocabRefSchema).default([]),
});

const UpdateStorySchema = z.object({
  title: z.string().trim().min(1).optional(),
  summary: z.string().trim().min(1).optional(),
  content: z.string().trim().min(1).optional(),
  level: Level.optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  grammarRefs: z.array(z.string().trim().min(1)).optional(),
  vocabRefs: z.array(StoryVocabRefSchema).optional(),
});

function formatStory(item: {
  id: string;
  title: string;
  content: string;
  summary: string;
  level: "beginner" | "intermediate" | "advanced";
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
  tags: { tag: { name: string } }[];
  grammarRefs: { grammarId: string }[];
  vocabRefs: { vocabItemId: string; highlightText: string }[];
}) {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    summary: item.summary,
    level: item.level,
    teacherId: item.teacherId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    tags: item.tags.map((t) => t.tag.name),
    grammarRefs: item.grammarRefs.map((ref) => ref.grammarId),
    vocabRefs: item.vocabRefs.map((ref) => ({
      vocabItemId: ref.vocabItemId,
      highlightText: ref.highlightText,
    })),
  };
}

storiesRouter.get("/", authRequired, async (_req, res, next) => {
  try {
    const items = await prisma.story.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        tags: {
          include: { tag: true },
        },
        grammarRefs: true,
        vocabRefs: true,
      },
    });

    return res.json(items.map(formatStory));
  } catch (error) {
    return next(error);
  }
});

storiesRouter.get("/:id", authRequired, async (req, res, next) => {
  try {
    const item = await prisma.story.findUnique({
      where: { id: req.params.id },
      include: {
        tags: {
          include: { tag: true },
        },
        grammarRefs: true,
        vocabRefs: true,
      },
    });

    if (!item) {
      return res.status(404).json({ error: "Story not found" });
    }

    return res.json(formatStory(item));
  } catch (error) {
    return next(error);
  }
});

storiesRouter.post("/", authRequired, teacherOrAdmin, async (req, res, next) => {
  try {
    const input = CreateStorySchema.parse(req.body);

    const created = await prisma.story.create({
      data: {
        title: input.title,
        summary: input.summary,
        content: input.content,
        level: input.level,
        teacherId: req.auth!.sub,
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
        grammarRefs: {
          create: input.grammarRefs.map((grammarId) => ({
            grammarId,
          })),
        },
        vocabRefs: {
          create: input.vocabRefs.map((ref) => ({
            vocabItemId: ref.vocabItemId,
            highlightText: ref.highlightText,
          })),
        },
      },
      include: {
        tags: {
          include: { tag: true },
        },
        grammarRefs: true,
        vocabRefs: true,
      },
    });

    return res.status(201).json(formatStory(created));
  } catch (error) {
    return next(error);
  }
});

storiesRouter.patch("/:id", authRequired, teacherOrAdmin, async (req, res, next) => {
  try {
    const input = UpdateStorySchema.parse(req.body);

    const existing = await prisma.story.findUnique({
      where: { id: req.params.id },
      include: {
        tags: {
          include: { tag: true },
        },
        grammarRefs: true,
        vocabRefs: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Story not found" });
    }

    if (req.auth!.role !== "admin" && existing.teacherId !== req.auth!.sub) {
      return res.status(403).json({ error: "You can only update your own stories" });
    }

    const nextTitle = input.title ?? existing.title;
    const nextSummary = input.summary ?? existing.summary;
    const nextContent = input.content ?? existing.content;
    const nextLevel = input.level ?? existing.level;
    const nextTags = input.tags ?? existing.tags.map((item) => item.tag.name);
    const nextGrammarRefs = input.grammarRefs ?? existing.grammarRefs.map((item) => item.grammarId);
    const nextVocabRefs =
      input.vocabRefs ??
      existing.vocabRefs.map((item) => ({
        vocabItemId: item.vocabItemId,
        highlightText: item.highlightText,
      }));

    const updated = await prisma.$transaction(async (tx) => {
      await tx.story.update({
        where: { id: req.params.id },
        data: {
          title: nextTitle,
          summary: nextSummary,
          content: nextContent,
          level: nextLevel,
        },
      });

      await tx.storyTag.deleteMany({
        where: { storyId: req.params.id },
      });

      await tx.storyGrammarRef.deleteMany({
        where: { storyId: req.params.id },
      });

      await tx.storyVocabRef.deleteMany({
        where: { storyId: req.params.id },
      });

      for (const rawTag of nextTags) {
        const tagName = rawTag.trim();
        if (!tagName) continue;

        const tag = await tx.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });

        await tx.storyTag.create({
          data: {
            storyId: req.params.id,
            tagId: tag.id,
          },
        });
      }

      for (const grammarId of nextGrammarRefs) {
        await tx.storyGrammarRef.create({
          data: {
            storyId: req.params.id,
            grammarId,
          },
        });
      }

      for (const ref of nextVocabRefs) {
        await tx.storyVocabRef.create({
          data: {
            storyId: req.params.id,
            vocabItemId: ref.vocabItemId,
            highlightText: ref.highlightText,
          },
        });
      }

      return tx.story.findUnique({
        where: { id: req.params.id },
        include: {
          tags: {
            include: { tag: true },
          },
          grammarRefs: true,
          vocabRefs: true,
        },
      });
    });

    if (!updated) {
      return res.status(404).json({ error: "Story not found after update" });
    }

    return res.json(formatStory(updated));
  } catch (error) {
    return next(error);
  }
});

storiesRouter.delete("/:id", authRequired, teacherOrAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.story.findUnique({
      where: { id: req.params.id },
      select: { id: true, teacherId: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Story not found" });
    }

    if (req.auth!.role !== "admin" && existing.teacherId !== req.auth!.sub) {
      return res.status(403).json({ error: "You can only delete your own stories" });
    }

    await prisma.story.delete({
      where: { id: req.params.id },
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});