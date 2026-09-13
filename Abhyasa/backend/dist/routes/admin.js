import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
export const adminRouter = Router();
adminRouter.use(authRequired, adminOnly);
const UserRoleSchema = z.enum(["admin", "teacher", "student"]);
const CreateUserSchema = z.object({
    name: z.string().trim().min(1),
    email: z.string().trim().email(),
    password: z.string().min(6),
    role: UserRoleSchema,
});
const UpdateUserRoleSchema = z.object({
    role: UserRoleSchema,
});
adminRouter.get("/dashboard", async (_req, res, next) => {
    try {
        const [usersCount, teachersCount, studentsCount, classroomsCount, grammarCount, storiesCount, vocabListsCount, vocabItemsCount, pronunciationCount, quizzesCount, quizAttemptsCount, pronunciationAttemptsCount, progressCount,] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: "teacher" } }),
            prisma.user.count({ where: { role: "student" } }),
            prisma.classroom.count(),
            prisma.grammarLesson.count(),
            prisma.story.count(),
            prisma.vocabList.count(),
            prisma.vocabItem.count(),
            prisma.pronunciationExercise.count(),
            prisma.quiz.count(),
            prisma.quizAttempt.count(),
            prisma.pronunciationAttempt.count(),
            prisma.progressCompletion.count(),
        ]);
        return res.json({
            usersCount,
            teachersCount,
            studentsCount,
            classroomsCount,
            grammarCount,
            storiesCount,
            vocabListsCount,
            vocabItemsCount,
            pronunciationCount,
            quizzesCount,
            quizAttemptsCount,
            pronunciationAttemptsCount,
            progressCount,
        });
    }
    catch (error) {
        return next(error);
    }
});
adminRouter.get("/stats", async (_req, res, next) => {
    try {
        const [totalUsers, totalTeachers, totalStudents, totalClassrooms, totalGrammar, totalStories, totalVocabLists, totalVocabItems, totalPronunciation, totalQuizzes, totalQuizAttempts, totalPronunciationAttempts, totalProgressCompletions,] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: "teacher" } }),
            prisma.user.count({ where: { role: "student" } }),
            prisma.classroom.count(),
            prisma.grammarLesson.count(),
            prisma.story.count(),
            prisma.vocabList.count(),
            prisma.vocabItem.count(),
            prisma.pronunciationExercise.count(),
            prisma.quiz.count(),
            prisma.quizAttempt.count(),
            prisma.pronunciationAttempt.count(),
            prisma.progressCompletion.count(),
        ]);
        return res.json({
            totalUsers,
            totalTeachers,
            totalStudents,
            totalClassrooms,
            totalGrammar,
            totalStories,
            totalVocabLists,
            totalVocabItems,
            totalPronunciation,
            totalQuizzes,
            totalQuizAttempts,
            totalPronunciationAttempts,
            totalProgressCompletions,
        });
    }
    catch (error) {
        return next(error);
    }
});
adminRouter.get("/users", async (req, res, next) => {
    try {
        const role = typeof req.query.role === "string" && req.query.role.trim()
            ? req.query.role.trim()
            : "";
        const search = typeof req.query.search === "string" && req.query.search.trim()
            ? req.query.search.trim()
            : "";
        const parsedRole = role && ["admin", "teacher", "student"].includes(role) ? role : "";
        const users = await prisma.user.findMany({
            where: {
                ...(parsedRole ? { role: parsedRole } : {}),
                ...(search
                    ? {
                        OR: [
                            {
                                name: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                            {
                                email: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                        ],
                    }
                    : {}),
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
        return res.json(users);
    }
    catch (error) {
        return next(error);
    }
});
adminRouter.post("/users", async (req, res, next) => {
    try {
        const input = CreateUserSchema.parse(req.body);
        const passwordHash = await bcrypt.hash(input.password, 10);
        const existing = await prisma.user.findUnique({
            where: { email: input.email.toLowerCase() },
            select: { id: true },
        });
        if (existing) {
            return res.status(409).json({ error: "Email is already registered" });
        }
        const user = await prisma.user.create({
            data: {
                name: input.name,
                email: input.email.toLowerCase(),
                passwordHash,
                role: input.role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
        return res.status(201).json(user);
    }
    catch (error) {
        return next(error);
    }
});
adminRouter.patch("/users/:id/role", async (req, res, next) => {
    try {
        const input = UpdateUserRoleSchema.parse(req.body);
        const existing = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: { id: true },
        });
        if (!existing) {
            return res.status(404).json({ error: "User not found" });
        }
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: {
                role: input.role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
        return res.json(user);
    }
    catch (error) {
        return next(error);
    }
});
adminRouter.delete("/users/:id", async (req, res, next) => {
    try {
        const existing = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: { id: true, role: true },
        });
        if (!existing) {
            return res.status(404).json({ error: "User not found" });
        }
        const adminCount = await prisma.user.count({
            where: { role: "admin" },
        });
        if (existing.role === "admin" && adminCount <= 1) {
            return res.status(400).json({
                error: "Cannot delete the last admin user",
            });
        }
        await prisma.user.delete({
            where: { id: req.params.id },
        });
        return res.status(204).send();
    }
    catch (error) {
        return next(error);
    }
});
adminRouter.get("/classrooms", async (_req, res, next) => {
    try {
        const classrooms = await prisma.classroom.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                students: {
                    select: {
                        studentId: true,
                    },
                },
            },
        });
        return res.json(classrooms.map((classroom) => ({
            id: classroom.id,
            name: classroom.name,
            code: classroom.code,
            teacherId: classroom.teacherId,
            createdAt: classroom.createdAt,
            teacher: classroom.teacher,
            studentsCount: classroom.students.length,
        })));
    }
    catch (error) {
        return next(error);
    }
});
adminRouter.get("/classrooms/:id/content", async (req, res, next) => {
    try {
        const classroom = await prisma.classroom.findUnique({
            where: { id: req.params.id },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                students: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                createdAt: true,
                            },
                        },
                    },
                    orderBy: {
                        joinedAt: "desc",
                    },
                },
                grammarAssignments: {
                    include: {
                        grammar: true,
                    },
                    orderBy: {
                        assignedAt: "desc",
                    },
                },
                storyAssignments: {
                    include: {
                        story: true,
                    },
                    orderBy: {
                        assignedAt: "desc",
                    },
                },
                vocabListAssignments: {
                    include: {
                        vocabList: {
                            include: {
                                items: true,
                            },
                        },
                    },
                    orderBy: {
                        assignedAt: "desc",
                    },
                },
                pronunciationAssignments: {
                    include: {
                        exercise: true,
                    },
                    orderBy: {
                        assignedAt: "desc",
                    },
                },
                quizAssignments: {
                    include: {
                        quiz: {
                            include: {
                                questions: {
                                    include: {
                                        options: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        assignedAt: "desc",
                    },
                },
            },
        });
        if (!classroom) {
            return res.status(404).json({ error: "Classroom not found" });
        }
        return res.json({
            classroom: {
                id: classroom.id,
                name: classroom.name,
                code: classroom.code,
                teacherId: classroom.teacherId,
                createdAt: classroom.createdAt,
                teacher: classroom.teacher,
                studentsCount: classroom.students.length,
                students: classroom.students.map((item) => ({
                    id: item.student.id,
                    name: item.student.name,
                    email: item.student.email,
                    joinedAt: item.joinedAt,
                    createdAt: item.student.createdAt,
                })),
            },
            grammarLessons: classroom.grammarAssignments.map((item) => ({
                ...item.grammar,
                assignedAt: item.assignedAt,
            })),
            stories: classroom.storyAssignments.map((item) => ({
                ...item.story,
                assignedAt: item.assignedAt,
            })),
            vocabLists: classroom.vocabListAssignments.map((item) => ({
                ...item.vocabList,
                assignedAt: item.assignedAt,
            })),
            pronunciationExercises: classroom.pronunciationAssignments.map((item) => ({
                ...item.exercise,
                assignedAt: item.assignedAt,
            })),
            quizzes: classroom.quizAssignments.map((item) => ({
                ...item.quiz,
                assignedAt: item.assignedAt,
            })),
        });
    }
    catch (error) {
        return next(error);
    }
});
adminRouter.delete("/classrooms/:id", async (req, res, next) => {
    try {
        const existing = await prisma.classroom.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                name: true,
            },
        });
        if (!existing) {
            return res.status(404).json({ error: "Classroom not found" });
        }
        await prisma.classroom.delete({
            where: { id: req.params.id },
        });
        return res.status(204).send();
    }
    catch (error) {
        return next(error);
    }
});
adminRouter.get("/teacher-analytics", async (_req, res, next) => {
    try {
        const teachers = await prisma.user.findMany({
            where: { role: "teacher" },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                taughtClassrooms: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        createdAt: true,
                        students: {
                            select: {
                                studentId: true,
                            },
                        },
                        grammarAssignments: true,
                        storyAssignments: true,
                        vocabListAssignments: true,
                        pronunciationAssignments: true,
                        quizAssignments: true,
                    },
                },
                grammarLessons: {
                    select: { id: true },
                },
                stories: {
                    select: { id: true },
                },
                vocabLists: {
                    select: { id: true },
                },
                pronunciationExercises: {
                    select: { id: true },
                },
                quizzes: {
                    select: {
                        id: true,
                        attempts: {
                            select: {
                                id: true,
                                score: true,
                                totalQuestions: true,
                            },
                        },
                    },
                },
            },
        });
        return res.json(teachers.map((teacher) => {
            const quizAttempts = teacher.quizzes.flatMap((quiz) => quiz.attempts);
            const averageQuizScore = quizAttempts.length === 0
                ? 0
                : Math.round(quizAttempts.reduce((sum, attempt) => {
                    if (attempt.totalQuestions === 0)
                        return sum;
                    return sum + (attempt.score / attempt.totalQuestions) * 100;
                }, 0) / quizAttempts.length);
            const uniqueStudentIds = new Set(teacher.taughtClassrooms.flatMap((classroom) => classroom.students.map((student) => student.studentId)));
            return {
                id: teacher.id,
                name: teacher.name,
                email: teacher.email,
                createdAt: teacher.createdAt,
                classroomsCount: teacher.taughtClassrooms.length,
                studentsCount: uniqueStudentIds.size,
                grammarCount: teacher.grammarLessons.length,
                storiesCount: teacher.stories.length,
                vocabListsCount: teacher.vocabLists.length,
                pronunciationCount: teacher.pronunciationExercises.length,
                quizzesCount: teacher.quizzes.length,
                quizAttemptsCount: quizAttempts.length,
                averageQuizScore,
                classrooms: teacher.taughtClassrooms.map((classroom) => ({
                    id: classroom.id,
                    name: classroom.name,
                    code: classroom.code,
                    createdAt: classroom.createdAt,
                    studentsCount: classroom.students.length,
                    assignedContentCount: classroom.grammarAssignments.length +
                        classroom.storyAssignments.length +
                        classroom.vocabListAssignments.length +
                        classroom.pronunciationAssignments.length +
                        classroom.quizAssignments.length,
                })),
            };
        }));
    }
    catch (error) {
        return next(error);
    }
});
adminRouter.get("/student-analytics", async (_req, res, next) => {
    try {
        const students = await prisma.user.findMany({
            where: { role: "student" },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                joinedClassrooms: {
                    select: {
                        classroom: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                teacher: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                        joinedAt: true,
                    },
                },
                progressCompletions: {
                    select: {
                        id: true,
                        contentType: true,
                        contentId: true,
                        completedAt: true,
                    },
                    orderBy: {
                        completedAt: "desc",
                    },
                },
                quizAttempts: {
                    select: {
                        id: true,
                        quizId: true,
                        score: true,
                        totalQuestions: true,
                        completedAt: true,
                        quiz: {
                            select: {
                                id: true,
                                title: true,
                                level: true,
                            },
                        },
                    },
                    orderBy: {
                        completedAt: "desc",
                    },
                },
                pronunciationAttempts: {
                    select: {
                        id: true,
                        exerciseId: true,
                        score: true,
                        matchPercent: true,
                        timestamp: true,
                        exercise: {
                            select: {
                                id: true,
                                targetText: true,
                                level: true,
                                type: true,
                            },
                        },
                    },
                    orderBy: {
                        timestamp: "desc",
                    },
                },
            },
        });
        return res.json(students.map((student) => {
            const completedByType = student.progressCompletions.reduce((acc, item) => {
                acc[item.contentType] = (acc[item.contentType] ?? 0) + 1;
                return acc;
            }, {
                grammar: 0,
                story: 0,
                vocab: 0,
                pronunciation: 0,
                quiz: 0,
            });
            const averageQuizScore = student.quizAttempts.length === 0
                ? 0
                : Math.round(student.quizAttempts.reduce((sum, attempt) => {
                    if (attempt.totalQuestions === 0)
                        return sum;
                    return sum + (attempt.score / attempt.totalQuestions) * 100;
                }, 0) / student.quizAttempts.length);
            const averagePronunciationScore = student.pronunciationAttempts.length === 0
                ? 0
                : Math.round(student.pronunciationAttempts.reduce((sum, attempt) => sum + Number(attempt.matchPercent), 0) / student.pronunciationAttempts.length);
            const activityDates = [
                ...student.progressCompletions.map((item) => item.completedAt),
                ...student.quizAttempts.map((item) => item.completedAt),
                ...student.pronunciationAttempts.map((item) => item.timestamp),
            ].sort((a, b) => b.getTime() - a.getTime());
            return {
                id: student.id,
                name: student.name,
                email: student.email,
                createdAt: student.createdAt,
                classroomsCount: student.joinedClassrooms.length,
                completedCount: student.progressCompletions.length,
                quizAttemptsCount: student.quizAttempts.length,
                pronunciationAttemptsCount: student.pronunciationAttempts.length,
                averageQuizScore,
                averagePronunciationScore,
                lastActivityAt: activityDates[0] ?? null,
                completedByType,
                classrooms: student.joinedClassrooms.map((item) => ({
                    id: item.classroom.id,
                    name: item.classroom.name,
                    code: item.classroom.code,
                    joinedAt: item.joinedAt,
                    teacher: item.classroom.teacher,
                })),
                recentQuizAttempts: student.quizAttempts.slice(0, 5).map((attempt) => ({
                    id: attempt.id,
                    quizId: attempt.quizId,
                    quizTitle: attempt.quiz.title,
                    quizLevel: attempt.quiz.level,
                    score: attempt.score,
                    totalQuestions: attempt.totalQuestions,
                    percentage: attempt.totalQuestions === 0
                        ? 0
                        : Math.round((attempt.score / attempt.totalQuestions) * 100),
                    completedAt: attempt.completedAt,
                })),
                recentPronunciationAttempts: student.pronunciationAttempts
                    .slice(0, 5)
                    .map((attempt) => ({
                    id: attempt.id,
                    exerciseId: attempt.exerciseId,
                    targetText: attempt.exercise.targetText,
                    level: attempt.exercise.level,
                    type: attempt.exercise.type,
                    score: attempt.score,
                    matchPercent: Number(attempt.matchPercent),
                    timestamp: attempt.timestamp,
                })),
            };
        }));
    }
    catch (error) {
        return next(error);
    }
});
