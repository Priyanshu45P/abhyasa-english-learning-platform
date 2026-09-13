import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { scoreQuizAttempt } from "../lib/quizScoring.js";
import { authRequired, teacherOrAdmin } from "../middleware/auth.js";
export const quizzesRouter = Router();
const Level = z.enum(["beginner", "intermediate", "advanced"]);
const LinkableQuizContentType = z.enum([
    "grammar",
    "story",
    "vocab",
    "pronunciation",
]);
const QuizContentLinkInputSchema = z.object({
    linkedType: LinkableQuizContentType,
    linkedId: z.string().trim().min(1),
});
const QuizOptionInputSchema = z.object({
    text: z.string().trim().min(1),
});
const QuizQuestionInputSchema = z.object({
    text: z.string().trim().min(1),
    explanation: z.string().trim().default(""),
    options: z.array(QuizOptionInputSchema).min(2),
    correctOptionIndex: z.number().int().min(0),
});
const CreateQuizSchema = z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    level: Level,
    questions: z.array(QuizQuestionInputSchema).min(1),
    contentLinks: z.array(QuizContentLinkInputSchema).default([]),
});
const UpdateQuizSchema = z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    level: Level.optional(),
    questions: z.array(QuizQuestionInputSchema).min(1).optional(),
    contentLinks: z.array(QuizContentLinkInputSchema).optional(),
});
const SubmitQuizAttemptSchema = z.object({
    quizId: z.string().min(1),
    answers: z.array(z.object({
        questionId: z.string().min(1),
        selectedOptionId: z.string().min(1),
    })),
});
function normalizeQuizContentLinks(contentLinks) {
    const unique = new Map();
    for (const link of contentLinks) {
        unique.set(`${link.linkedType}:${link.linkedId}`, link);
    }
    return Array.from(unique.values());
}
async function validateQuizContentLinks(userId, role, contentLinks) {
    for (const link of contentLinks) {
        let item = null;
        let label = "";
        if (link.linkedType === "grammar") {
            label = "Grammar lesson";
            item = await prisma.grammarLesson.findUnique({
                where: { id: link.linkedId },
                select: { teacherId: true },
            });
        }
        if (link.linkedType === "story") {
            label = "Story";
            item = await prisma.story.findUnique({
                where: { id: link.linkedId },
                select: { teacherId: true },
            });
        }
        if (link.linkedType === "vocab") {
            label = "Vocabulary item";
            item = await prisma.vocabItem.findUnique({
                where: { id: link.linkedId },
                select: { teacherId: true },
            });
        }
        if (link.linkedType === "pronunciation") {
            label = "Pronunciation exercise";
            item = await prisma.pronunciationExercise.findUnique({
                where: { id: link.linkedId },
                select: { teacherId: true },
            });
        }
        if (!item) {
            return {
                ok: false,
                status: 404,
                message: `${label} not found for quiz link`,
            };
        }
        if (role !== "admin" && item.teacherId !== userId) {
            return {
                ok: false,
                status: 403,
                message: `You can only link quizzes to your own ${label.toLowerCase()}`,
            };
        }
    }
    return { ok: true };
}
function formatQuiz(item) {
    return {
        id: item.id,
        title: item.title,
        description: item.description,
        level: item.level,
        teacherId: item.teacherId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        contentLinks: item.contentLinks
            .filter((link) => link.linkedType !== "quiz")
            .map((link) => ({
            linkedType: link.linkedType,
            linkedId: link.linkedId,
        })),
        questions: item.questions.map((question) => ({
            id: question.id,
            quizId: question.quizId,
            text: question.text,
            explanation: question.explanation,
            correctOptionId: question.correctOptionId,
            options: question.options.map((option) => ({
                id: option.id,
                text: option.text,
            })),
        })),
    };
}
async function loadFormattedQuiz(quizId) {
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
            contentLinks: true,
            questions: {
                include: {
                    options: true,
                },
            },
        },
    });
    if (!quiz)
        return null;
    return formatQuiz(quiz);
}
quizzesRouter.get("/", authRequired, async (_req, res, next) => {
    try {
        const items = await prisma.quiz.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                contentLinks: true,
                questions: {
                    include: {
                        options: true,
                    },
                },
            },
        });
        return res.json(items.map(formatQuiz));
    }
    catch (error) {
        return next(error);
    }
});
quizzesRouter.get("/:id", authRequired, async (req, res, next) => {
    try {
        const item = await loadFormattedQuiz(req.params.id);
        if (!item) {
            return res.status(404).json({ error: "Quiz not found" });
        }
        return res.json(item);
    }
    catch (error) {
        return next(error);
    }
});
quizzesRouter.post("/", authRequired, teacherOrAdmin, async (req, res, next) => {
    try {
        const input = CreateQuizSchema.parse(req.body);
        const contentLinks = normalizeQuizContentLinks(input.contentLinks);
        const linkValidation = await validateQuizContentLinks(req.auth.sub, req.auth.role, contentLinks);
        if (!linkValidation.ok) {
            return res
                .status(linkValidation.status)
                .json({ error: linkValidation.message });
        }
        const created = await prisma.$transaction(async (tx) => {
            const quiz = await tx.quiz.create({
                data: {
                    title: input.title,
                    description: input.description,
                    level: input.level,
                    teacherId: req.auth.sub,
                },
            });
            if (contentLinks.length > 0) {
                await tx.quizContentLink.createMany({
                    data: contentLinks.map((link) => ({
                        quizId: quiz.id,
                        linkedType: link.linkedType,
                        linkedId: link.linkedId,
                    })),
                    skipDuplicates: true,
                });
            }
            for (const questionInput of input.questions) {
                const question = await tx.quizQuestion.create({
                    data: {
                        quizId: quiz.id,
                        text: questionInput.text,
                        explanation: questionInput.explanation,
                    },
                });
                const createdOptions = [];
                for (const optionInput of questionInput.options) {
                    const option = await tx.quizOption.create({
                        data: {
                            questionId: question.id,
                            text: optionInput.text,
                        },
                    });
                    createdOptions.push({
                        id: option.id,
                        text: option.text,
                    });
                }
                const correctOption = createdOptions[questionInput.correctOptionIndex];
                if (!correctOption) {
                    throw new Error("Invalid correct option index");
                }
                await tx.quizQuestion.update({
                    where: { id: question.id },
                    data: {
                        correctOptionId: correctOption.id,
                    },
                });
            }
            return quiz.id;
        });
        const quiz = await loadFormattedQuiz(created);
        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found after creation" });
        }
        return res.status(201).json(quiz);
    }
    catch (error) {
        return next(error);
    }
});
quizzesRouter.patch("/:id", authRequired, teacherOrAdmin, async (req, res, next) => {
    try {
        const input = UpdateQuizSchema.parse(req.body);
        const nextContentLinks = input.contentLinks === undefined
            ? undefined
            : normalizeQuizContentLinks(input.contentLinks);
        const existing = await prisma.quiz.findUnique({
            where: { id: req.params.id },
            include: {
                attempts: {
                    select: { id: true },
                },
                questions: {
                    include: {
                        options: true,
                    },
                },
            },
        });
        if (!existing) {
            return res.status(404).json({ error: "Quiz not found" });
        }
        if (req.auth.role !== "admin" && existing.teacherId !== req.auth.sub) {
            return res
                .status(403)
                .json({ error: "You can only update your own quizzes" });
        }
        if (existing.attempts.length > 0) {
            return res.status(400).json({
                error: "Quiz cannot be updated after students have attempted it",
            });
        }
        if (nextContentLinks !== undefined) {
            const linkValidation = await validateQuizContentLinks(req.auth.sub, req.auth.role, nextContentLinks);
            if (!linkValidation.ok) {
                return res
                    .status(linkValidation.status)
                    .json({ error: linkValidation.message });
            }
        }
        const nextTitle = input.title ?? existing.title;
        const nextDescription = input.description ?? existing.description;
        const nextLevel = input.level ?? existing.level;
        const nextQuestions = input.questions ??
            existing.questions.map((question) => ({
                text: question.text,
                explanation: question.explanation,
                options: question.options.map((option) => ({
                    text: option.text,
                })),
                correctOptionIndex: Math.max(0, question.options.findIndex((option) => option.id === question.correctOptionId)),
            }));
        await prisma.$transaction(async (tx) => {
            await tx.quiz.update({
                where: { id: req.params.id },
                data: {
                    title: nextTitle,
                    description: nextDescription,
                    level: nextLevel,
                },
            });
            if (nextContentLinks !== undefined) {
                await tx.quizContentLink.deleteMany({
                    where: { quizId: req.params.id },
                });
                if (nextContentLinks.length > 0) {
                    await tx.quizContentLink.createMany({
                        data: nextContentLinks.map((link) => ({
                            quizId: req.params.id,
                            linkedType: link.linkedType,
                            linkedId: link.linkedId,
                        })),
                        skipDuplicates: true,
                    });
                }
            }
            await tx.quizQuestion.deleteMany({
                where: {
                    quizId: req.params.id,
                },
            });
            for (const questionInput of nextQuestions) {
                const question = await tx.quizQuestion.create({
                    data: {
                        quizId: req.params.id,
                        text: questionInput.text,
                        explanation: questionInput.explanation,
                    },
                });
                const createdOptions = [];
                for (const optionInput of questionInput.options) {
                    const option = await tx.quizOption.create({
                        data: {
                            questionId: question.id,
                            text: optionInput.text,
                        },
                    });
                    createdOptions.push({
                        id: option.id,
                        text: option.text,
                    });
                }
                const correctOption = createdOptions[questionInput.correctOptionIndex];
                if (!correctOption) {
                    throw new Error("Invalid correct option index");
                }
                await tx.quizQuestion.update({
                    where: { id: question.id },
                    data: {
                        correctOptionId: correctOption.id,
                    },
                });
            }
        });
        const quiz = await loadFormattedQuiz(req.params.id);
        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found after update" });
        }
        return res.json(quiz);
    }
    catch (error) {
        return next(error);
    }
});
quizzesRouter.delete("/:id", authRequired, teacherOrAdmin, async (req, res, next) => {
    try {
        const existing = await prisma.quiz.findUnique({
            where: { id: req.params.id },
            include: {
                attempts: {
                    select: { id: true },
                },
            },
        });
        if (!existing) {
            return res.status(404).json({ error: "Quiz not found" });
        }
        if (req.auth.role !== "admin" && existing.teacherId !== req.auth.sub) {
            return res
                .status(403)
                .json({ error: "You can only delete your own quizzes" });
        }
        if (existing.attempts.length > 0) {
            return res.status(400).json({
                error: "Quiz cannot be deleted after students have attempted it",
            });
        }
        await prisma.quiz.delete({
            where: { id: req.params.id },
        });
        return res.status(204).send();
    }
    catch (error) {
        return next(error);
    }
});
quizzesRouter.post("/attempts", authRequired, async (req, res, next) => {
    try {
        const input = SubmitQuizAttemptSchema.parse(req.body);
        const quiz = await prisma.quiz.findUnique({
            where: { id: input.quizId },
            include: {
                questions: {
                    include: {
                        options: true,
                    },
                },
            },
        });
        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }
        const user = await prisma.user.findUnique({
            where: { id: req.auth.sub },
            select: { name: true },
        });
        const scoring = scoreQuizAttempt(quiz.questions.map((question) => ({
            id: question.id,
            correctOptionId: question.correctOptionId,
        })), input.answers);
        const correctCount = scoring.score;
        const attemptId = await prisma.$transaction(async (tx) => {
            const createdAttempt = await tx.quizAttempt.create({
                data: {
                    quizId: input.quizId,
                    userId: req.auth.sub,
                    userNameSnapshot: user?.name ?? "Student",
                    score: 0,
                    totalQuestions: quiz.questions.length,
                },
            });
            for (const answer of input.answers) {
                const question = quiz.questions.find((q) => q.id === answer.questionId);
                if (!question)
                    continue;
                const isCorrect = question.correctOptionId === answer.selectedOptionId;
                await tx.quizAnswer.create({
                    data: {
                        attemptId: createdAttempt.id,
                        questionId: answer.questionId,
                        selectedOptionId: answer.selectedOptionId,
                        isCorrect,
                    },
                });
            }
            await tx.quizAttempt.update({
                where: { id: createdAttempt.id },
                data: {
                    score: correctCount,
                },
            });
            return createdAttempt.id;
        });
        return res.status(201).json({
            attemptId,
            score: correctCount,
            totalQuestions: quiz.questions.length,
        });
    }
    catch (error) {
        return next(error);
    }
});
