import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, teacherOrAdmin } from "../middleware/auth.js";

export const pronunciationRouter = Router();

const Level = z.enum(["beginner", "intermediate", "advanced"]);
const TargetType = z.enum(["word", "phrase", "sentence"]);
const Score = z.enum(["exact", "close", "mismatch"]);

const CreateExerciseSchema = z.object({
  targetText: z.string().trim().min(1),
  type: TargetType,
  level: Level,
  instructions: z.string().trim().min(1),
  vocabLinks: z.array(z.string().min(1)).default([]),
  storyLinks: z.array(z.string().min(1)).default([]),
});

const UpdateExerciseSchema = z.object({
  targetText: z.string().trim().min(1),
  type: TargetType,
  level: Level,
  instructions: z.string().trim().min(1),
  vocabLinks: z.array(z.string().min(1)).default([]),
  storyLinks: z.array(z.string().min(1)).default([]),
});

const SubmitAttemptSchema = z.object({
  exerciseId: z.string().min(1),
  expected: z.string().trim().min(1),
  transcript: z.string().trim().min(1),
  score: Score,
  matchPercent: z.number().min(0).max(100),
  feedback: z.string().trim().min(1),
});

pronunciationRouter.get("/", authRequired, async (_req, res, next) => {
  try {
    const items = await prisma.pronunciationExercise.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vocabLinks: true,
        storyLinks: true,
      },
    });

    return res.json(
      items.map((item) => ({
        id: item.id,
        targetText: item.targetText,
        type: item.type,
        level: item.level,
        instructions: item.instructions,
        teacherId: item.teacherId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        vocabLinks: item.vocabLinks.map((v) => v.vocabItemId),
        storyLinks: item.storyLinks.map((s) => s.storyId),
      }))
    );
  } catch (error) {
    return next(error);
  }
});

pronunciationRouter.get("/attempts", authRequired, async (req, res, next) => {
  try {
    const exerciseId =
      typeof req.query.exerciseId === "string" ? req.query.exerciseId : "";

    if (!exerciseId.trim()) {
      return res.status(400).json({ error: "exerciseId is required" });
    }

    const attempts = await prisma.pronunciationAttempt.findMany({
      where: {
        userId: req.auth!.sub,
        exerciseId,
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    return res.json(
      attempts.map((attempt) => ({
        id: attempt.id,
        exerciseId: attempt.exerciseId,
        userId: attempt.userId,
        expected: attempt.expected,
        transcript: attempt.transcript,
        score: attempt.score,
        matchPercent: Number(attempt.matchPercent),
        feedback: attempt.feedback,
        timestamp: attempt.timestamp,
      }))
    );
  } catch (error) {
    return next(error);
  }
});

pronunciationRouter.post(
  "/",
  authRequired,
  teacherOrAdmin,
  async (req, res, next) => {
    try {
      const input = CreateExerciseSchema.parse(req.body);

      const created = await prisma.pronunciationExercise.create({
        data: {
          targetText: input.targetText,
          type: input.type,
          level: input.level,
          instructions: input.instructions,
          teacherId: req.auth!.sub,
          vocabLinks: {
            create: input.vocabLinks.map((vocabItemId) => ({ vocabItemId })),
          },
          storyLinks: {
            create: input.storyLinks.map((storyId) => ({ storyId })),
          },
        },
        include: {
          vocabLinks: true,
          storyLinks: true,
        },
      });

      return res.status(201).json({
        id: created.id,
        targetText: created.targetText,
        type: created.type,
        level: created.level,
        instructions: created.instructions,
        teacherId: created.teacherId,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        vocabLinks: created.vocabLinks.map((v) => v.vocabItemId),
        storyLinks: created.storyLinks.map((s) => s.storyId),
      });
    } catch (error) {
      return next(error);
    }
  }
);

pronunciationRouter.patch(
  "/:id",
  authRequired,
  teacherOrAdmin,
  async (req, res, next) => {
    try {
      const input = UpdateExerciseSchema.parse(req.body);

      const existing = await prisma.pronunciationExercise.findUnique({
        where: { id: req.params.id },
        select: { id: true, teacherId: true },
      });

      if (!existing) {
        return res
          .status(404)
          .json({ error: "Pronunciation exercise not found" });
      }

      if (req.auth!.role !== "admin" && existing.teacherId !== req.auth!.sub) {
        return res.status(403).json({
          error: "You can only update your own pronunciation exercises",
        });
      }

      const updated = await prisma.pronunciationExercise.update({
        where: { id: req.params.id },
        data: {
          targetText: input.targetText,
          type: input.type,
          level: input.level,
          instructions: input.instructions,
          vocabLinks: {
            deleteMany: {},
            create: input.vocabLinks.map((vocabItemId) => ({ vocabItemId })),
          },
          storyLinks: {
            deleteMany: {},
            create: input.storyLinks.map((storyId) => ({ storyId })),
          },
        },
        include: {
          vocabLinks: true,
          storyLinks: true,
        },
      });

      return res.json({
        id: updated.id,
        targetText: updated.targetText,
        type: updated.type,
        level: updated.level,
        instructions: updated.instructions,
        teacherId: updated.teacherId,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        vocabLinks: updated.vocabLinks.map((v) => v.vocabItemId),
        storyLinks: updated.storyLinks.map((s) => s.storyId),
      });
    } catch (error) {
      return next(error);
    }
  }
);

pronunciationRouter.delete(
  "/:id",
  authRequired,
  teacherOrAdmin,
  async (req, res, next) => {
    try {
      const existing = await prisma.pronunciationExercise.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          teacherId: true,
          _count: {
            select: {
              attempts: true,
            },
          },
        },
      });

      if (!existing) {
        return res
          .status(404)
          .json({ error: "Pronunciation exercise not found" });
      }

      if (req.auth!.role !== "admin" && existing.teacherId !== req.auth!.sub) {
        return res.status(403).json({
          error: "You can only delete your own pronunciation exercises",
        });
      }

      if (existing._count.attempts > 0) {
        return res.status(400).json({
          error:
            "Pronunciation exercise cannot be deleted after students have attempted it",
        });
      }

      await prisma.pronunciationExercise.delete({
        where: { id: req.params.id },
      });

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
);

pronunciationRouter.post("/attempts", authRequired, async (req, res, next) => {
  try {  // Validate request body.
    const input = SubmitAttemptSchema.parse(req.body);
// Check pronunciation exercise exists.
    const exercise = await prisma.pronunciationExercise.findUnique({
      where: { id: input.exerciseId },
      select: { id: true },
    });

    if (!exercise) {
      return res.status(404).json({ error: "Pronunciation exercise not found" });
    }
// Save attempt in database.
    const created = await prisma.pronunciationAttempt.create({
      data: {
        exerciseId: input.exerciseId,
        userId: req.auth!.sub,
        expected: input.expected,
        transcript: input.transcript,
        score: input.score,
        matchPercent: input.matchPercent,
        feedback: input.feedback,
      },
    });
// Return saved attempt to frontend.
    return res.status(201).json({
      id: created.id,
      exerciseId: created.exerciseId,
      userId: created.userId,
      expected: created.expected,
      transcript: created.transcript,
      score: created.score,
      matchPercent: Number(created.matchPercent),
      feedback: created.feedback,
      timestamp: created.timestamp,
    });
  } catch (error) {
    return next(error);
  }
});