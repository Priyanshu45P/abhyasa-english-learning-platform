import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, teacherOrAdmin } from "../middleware/auth.js";
export const progressRouter = Router();
const ContentTypeSchema = z.enum([
    "grammar",
    "story",
    "vocab",
    "pronunciation",
    "quiz",
]);
const MarkCompleteSchema = z.object({
    contentType: ContentTypeSchema,
    contentId: z.string().trim().min(1),
});
progressRouter.get("/", authRequired, async (req, res, next) => {
    try {
        const items = await prisma.progressCompletion.findMany({
            where: { userId: req.auth.sub },
            orderBy: { completedAt: "desc" },
        });
        return res.json(items.map((item) => ({
            id: item.id,
            userId: item.userId,
            contentType: item.contentType,
            contentId: item.contentId,
            completed: true,
            createdAt: item.completedAt,
            updatedAt: item.completedAt,
        })));
    }
    catch (error) {
        return next(error);
    }
});
progressRouter.post("/complete", authRequired, async (req, res, next) => {
    try {
        const input = MarkCompleteSchema.parse(req.body);
        const progress = await prisma.progressCompletion.upsert({
            where: {
                userId_contentType_contentId: {
                    userId: req.auth.sub,
                    contentType: input.contentType,
                    contentId: input.contentId,
                },
            },
            update: {
                completedAt: new Date(),
            },
            create: {
                userId: req.auth.sub,
                contentType: input.contentType,
                contentId: input.contentId,
            },
        });
        return res.json({
            id: progress.id,
            userId: progress.userId,
            contentType: progress.contentType,
            contentId: progress.contentId,
            completed: true,
            createdAt: progress.completedAt,
            updatedAt: progress.completedAt,
        });
    }
    catch (error) {
        return next(error);
    }
});
progressRouter.get("/student", authRequired, async (req, res, next) => {
    try {
        const userId = req.auth.sub;
        const completions = await prisma.progressCompletion.findMany({
            where: { userId },
            orderBy: { completedAt: "desc" },
        });
        const quizAttempts = await prisma.quizAttempt.findMany({
            where: { userId },
            orderBy: { completedAt: "desc" },
        });
        const pronunciationAttempts = await prisma.pronunciationAttempt.findMany({
            where: { userId },
            orderBy: { timestamp: "desc" },
        });
        return res.json({
            completions: completions.map((item) => ({
                id: item.id,
                userId: item.userId,
                contentType: item.contentType,
                contentId: item.contentId,
                completed: true,
                createdAt: item.completedAt,
                updatedAt: item.completedAt,
            })),
            quizAttempts: quizAttempts.map((item) => ({
                id: item.id,
                quizId: item.quizId,
                userId: item.userId,
                userNameSnapshot: item.userNameSnapshot,
                score: item.score,
                totalQuestions: item.totalQuestions,
                completedAt: item.completedAt,
            })),
            pronunciationAttempts: pronunciationAttempts.map((item) => ({
                id: item.id,
                exerciseId: item.exerciseId,
                userId: item.userId,
                expected: item.expected,
                transcript: item.transcript,
                score: item.score,
                matchPercent: Number(item.matchPercent),
                feedback: item.feedback,
                timestamp: item.timestamp,
            })),
        });
    }
    catch (error) {
        return next(error);
    }
});
progressRouter.get("/teacher/student/:studentId", authRequired, teacherOrAdmin, async (req, res, next) => {
    try {
        const teacherId = req.auth.sub;
        const { studentId } = req.params;
        const classrooms = await prisma.classroom.findMany({
            where: { teacherId },
            include: {
                students: true,
            },
        });
        const isStudentInTeacherClass = classrooms.some((classroom) => classroom.students.some((student) => student.studentId === studentId));
        if (!isStudentInTeacherClass) {
            return res.status(403).json({ error: "Unauthorized student access" });
        }
        const completions = await prisma.progressCompletion.findMany({
            where: { userId: studentId },
            orderBy: { completedAt: "desc" },
        });
        const quizAttempts = await prisma.quizAttempt.findMany({
            where: { userId: studentId },
            orderBy: { completedAt: "desc" },
        });
        const pronunciationAttempts = await prisma.pronunciationAttempt.findMany({
            where: { userId: studentId },
            orderBy: { timestamp: "desc" },
        });
        return res.json({
            completions: completions.map((item) => ({
                id: item.id,
                userId: item.userId,
                contentType: item.contentType,
                contentId: item.contentId,
                completed: true,
                createdAt: item.completedAt,
                updatedAt: item.completedAt,
            })),
            quizAttempts: quizAttempts.map((item) => ({
                id: item.id,
                quizId: item.quizId,
                userId: item.userId,
                userNameSnapshot: item.userNameSnapshot,
                score: item.score,
                totalQuestions: item.totalQuestions,
                completedAt: item.completedAt,
            })),
            pronunciationAttempts: pronunciationAttempts.map((item) => ({
                id: item.id,
                exerciseId: item.exerciseId,
                userId: item.userId,
                expected: item.expected,
                transcript: item.transcript,
                score: item.score,
                matchPercent: Number(item.matchPercent),
                feedback: item.feedback,
                timestamp: item.timestamp,
            })),
        });
    }
    catch (error) {
        return next(error);
    }
});
progressRouter.get("/teacher", authRequired, teacherOrAdmin, async (req, res, next) => {
    try {
        const teacherId = req.auth.sub;
        const classrooms = await prisma.classroom.findMany({
            where: { teacherId },
            include: {
                students: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        const studentIds = Array.from(new Set(classrooms.flatMap((classroom) => classroom.students.map((row) => row.studentId))));
        const quizAttempts = await prisma.quizAttempt.findMany({
            where: {
                userId: { in: studentIds },
            },
            include: {
                quiz: {
                    select: {
                        id: true,
                        title: true,
                        level: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                completedAt: "desc",
            },
        });
        const pronunciationAttempts = await prisma.pronunciationAttempt.findMany({
            where: {
                userId: { in: studentIds },
            },
            include: {
                exercise: {
                    select: {
                        id: true,
                        targetText: true,
                        level: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                timestamp: "desc",
            },
        });
        const completions = await prisma.progressCompletion.findMany({
            where: {
                userId: { in: studentIds },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                completedAt: "desc",
            },
        });
        const quizIds = Array.from(new Set(quizAttempts.map((attempt) => attempt.quizId)));
        const classroomQuizLinks = quizIds.length === 0
            ? []
            : await prisma.classroomQuiz.findMany({
                where: {
                    quizId: { in: quizIds },
                    classroom: {
                        teacherId,
                    },
                },
                include: {
                    classroom: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
            });
        const quizIdToClassrooms = new Map();
        for (const link of classroomQuizLinks) {
            const existing = quizIdToClassrooms.get(link.quizId) ?? [];
            existing.push({
                id: link.classroom.id,
                name: link.classroom.name,
                code: link.classroom.code,
            });
            quizIdToClassrooms.set(link.quizId, existing);
        }
        return res.json({
            classrooms: classrooms.map((classroom) => ({
                id: classroom.id,
                name: classroom.name,
                code: classroom.code,
                createdAt: classroom.createdAt,
                studentsCount: classroom.students.length,
                students: classroom.students.map((row) => ({
                    id: row.student.id,
                    name: row.student.name,
                    email: row.student.email,
                    joinedAt: row.joinedAt,
                })),
            })),
            quizAttempts: quizAttempts.map((attempt) => ({
                id: attempt.id,
                quizId: attempt.quizId,
                quizTitle: attempt.quiz.title,
                quizLevel: attempt.quiz.level,
                userId: attempt.userId,
                userNameSnapshot: attempt.userNameSnapshot,
                userEmail: attempt.user.email,
                score: attempt.score,
                totalQuestions: attempt.totalQuestions,
                completedAt: attempt.completedAt,
                classrooms: quizIdToClassrooms.get(attempt.quizId) ?? [],
            })),
            pronunciationAttempts: pronunciationAttempts.map((attempt) => ({
                id: attempt.id,
                exerciseId: attempt.exerciseId,
                exerciseTargetText: attempt.exercise.targetText,
                exerciseLevel: attempt.exercise.level,
                userId: attempt.userId,
                userNameSnapshot: attempt.user.name,
                userEmail: attempt.user.email,
                expected: attempt.expected,
                transcript: attempt.transcript,
                score: attempt.score,
                matchPercent: Number(attempt.matchPercent),
                feedback: attempt.feedback,
                timestamp: attempt.timestamp,
            })),
            completions: completions.map((item) => ({
                id: item.id,
                userId: item.userId,
                userNameSnapshot: item.user.name,
                userEmail: item.user.email,
                contentType: item.contentType,
                contentId: item.contentId,
                completed: true,
                createdAt: item.completedAt,
                updatedAt: item.completedAt,
            })),
        });
    }
    catch (error) {
        return next(error);
    }
});
