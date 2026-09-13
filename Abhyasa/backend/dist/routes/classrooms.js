import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, teacherOrAdmin } from "../middleware/auth.js";
export const classroomsRouter = Router();
function generateCode(length = 6) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < length; i += 1) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}
async function generateUniqueClassroomCode() {
    for (let i = 0; i < 10; i += 1) {
        const code = generateCode();
        const existing = await prisma.classroom.findUnique({
            where: { code },
            select: { id: true },
        });
        if (!existing)
            return code;
    }
    throw new Error("Failed to generate unique classroom code");
}
const CreateClassroomSchema = z.object({
    name: z.string().trim().min(1, "Classroom name is required"),
});
const JoinClassroomSchema = z.object({
    code: z.string().trim().min(4, "Classroom code is required"),
});
const ClassroomContentTypeSchema = z.enum([
    "grammar",
    "story",
    "vocab",
    "pronunciation",
    "quiz",
]);
const AssignClassroomContentSchema = z.object({
    contentType: ClassroomContentTypeSchema,
    contentId: z.string().trim().min(1, "Content ID is required"),
});
async function getAccessibleClassroom(classroomId, userId, role) {
    const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
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
                            role: true,
                            createdAt: true,
                        },
                    },
                },
            },
        },
    });
    if (!classroom) {
        return { error: { status: 404, message: "Classroom not found" } };
    }
    const isTeacherOwner = classroom.teacherId === userId;
    const isJoinedStudent = classroom.students.some((row) => row.studentId === userId);
    const isAdmin = role === "admin";
    if (!isAdmin && !isTeacherOwner && !isJoinedStudent) {
        return {
            error: {
                status: 403,
                message: "You do not have access to this classroom",
            },
        };
    }
    return { classroom };
}
async function getManageableClassroom(classroomId, userId, role) {
    const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
        select: {
            id: true,
            name: true,
            code: true,
            teacherId: true,
            createdAt: true,
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
                            role: true,
                            createdAt: true,
                        },
                    },
                },
            },
        },
    });
    if (!classroom) {
        return { error: { status: 404, message: "Classroom not found" } };
    }
    const isAdmin = role === "admin";
    const isTeacherOwner = classroom.teacherId === userId;
    if (!isAdmin && !isTeacherOwner) {
        return {
            error: {
                status: 403,
                message: "You can only manage your own classroom",
            },
        };
    }
    return { classroom };
}
async function getClassroomContentPayload(classroomId) {
    const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
        select: {
            id: true,
            name: true,
            code: true,
            createdAt: true,
            teacherId: true,
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
                            role: true,
                            createdAt: true,
                        },
                    },
                },
            },
            grammarAssignments: {
                orderBy: {
                    assignedAt: "desc",
                },
                include: {
                    grammar: {
                        include: {
                            tags: {
                                include: {
                                    tag: true,
                                },
                            },
                        },
                    },
                },
            },
            storyAssignments: {
                orderBy: {
                    assignedAt: "desc",
                },
                include: {
                    story: {
                        include: {
                            grammarRefs: true,
                            vocabRefs: true,
                            tags: {
                                include: {
                                    tag: true,
                                },
                            },
                        },
                    },
                },
            },
            vocabListAssignments: {
                orderBy: {
                    assignedAt: "desc",
                },
                include: {
                    vocabList: {
                        include: {
                            items: {
                                orderBy: {
                                    createdAt: "asc",
                                },
                            },
                        },
                    },
                },
            },
            pronunciationAssignments: {
                orderBy: {
                    assignedAt: "desc",
                },
                include: {
                    exercise: {
                        include: {
                            vocabLinks: true,
                            storyLinks: true,
                        },
                    },
                },
            },
            quizAssignments: {
                orderBy: {
                    assignedAt: "desc",
                },
                include: {
                    quiz: {
                        include: {
                            contentLinks: true,
                            questions: {
                                include: {
                                    options: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    if (!classroom) {
        return null;
    }
    return {
        classroom: {
            id: classroom.id,
            name: classroom.name,
            code: classroom.code,
            createdAt: classroom.createdAt,
            teacherId: classroom.teacherId,
            teacher: classroom.teacher,
            studentsCount: classroom.students.length,
            students: classroom.students.map((row) => ({
                id: row.student.id,
                name: row.student.name,
                email: row.student.email,
                role: row.student.role,
                createdAt: row.student.createdAt,
                joinedAt: row.joinedAt,
            })),
        },
        grammarLessons: classroom.grammarAssignments.map((row) => ({
            id: row.grammar.id,
            title: row.grammar.title,
            content: row.grammar.content,
            level: row.grammar.level,
            teacherId: row.grammar.teacherId,
            createdAt: row.grammar.createdAt,
            updatedAt: row.grammar.updatedAt,
            tags: row.grammar.tags.map((tagLink) => tagLink.tag.name),
            assignedAt: row.assignedAt,
        })),
        stories: classroom.storyAssignments.map((row) => ({
            id: row.story.id,
            title: row.story.title,
            content: row.story.content,
            summary: row.story.summary,
            level: row.story.level,
            teacherId: row.story.teacherId,
            createdAt: row.story.createdAt,
            updatedAt: row.story.updatedAt,
            tags: row.story.tags.map((tagLink) => tagLink.tag.name),
            grammarRefs: row.story.grammarRefs.map((ref) => ref.grammarId),
            vocabRefs: row.story.vocabRefs.map((ref) => ({
                vocabItemId: ref.vocabItemId,
                highlightText: ref.highlightText,
            })),
            assignedAt: row.assignedAt,
        })),
        vocabLists: classroom.vocabListAssignments.map((row) => ({
            id: row.vocabList.id,
            name: row.vocabList.name,
            description: row.vocabList.description,
            level: row.vocabList.level,
            teacherId: row.vocabList.teacherId,
            createdAt: row.vocabList.createdAt,
            updatedAt: row.vocabList.updatedAt,
            assignedAt: row.assignedAt,
        })),
        pronunciationExercises: classroom.pronunciationAssignments.map((row) => ({
            id: row.exercise.id,
            targetText: row.exercise.targetText,
            type: row.exercise.type,
            level: row.exercise.level,
            instructions: row.exercise.instructions,
            teacherId: row.exercise.teacherId,
            createdAt: row.exercise.createdAt,
            updatedAt: row.exercise.updatedAt,
            vocabLinks: row.exercise.vocabLinks.map((link) => link.vocabItemId),
            storyLinks: row.exercise.storyLinks.map((link) => link.storyId),
            assignedAt: row.assignedAt,
        })),
        quizzes: classroom.quizAssignments.map((row) => ({
            id: row.quiz.id,
            title: row.quiz.title,
            description: row.quiz.description,
            level: row.quiz.level,
            teacherId: row.quiz.teacherId,
            createdAt: row.quiz.createdAt,
            updatedAt: row.quiz.updatedAt,
            contentLinks: row.quiz.contentLinks.map((link) => ({
                linkedType: link.linkedType,
                linkedId: link.linkedId,
            })),
            questions: row.quiz.questions.map((question) => ({
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
            assignedAt: row.assignedAt,
        })),
    };
}
async function ensureTeacherOwnsContent(teacherId, contentType, contentId) {
    switch (contentType) {
        case "grammar": {
            const item = await prisma.grammarLesson.findUnique({
                where: { id: contentId },
                select: { id: true, teacherId: true },
            });
            if (!item) {
                return {
                    error: { status: 404, message: "Grammar lesson not found" },
                };
            }
            if (item.teacherId !== teacherId) {
                return {
                    error: {
                        status: 403,
                        message: "You can only assign your own grammar lessons",
                    },
                };
            }
            return { item };
        }
        case "story": {
            const item = await prisma.story.findUnique({
                where: { id: contentId },
                select: { id: true, teacherId: true },
            });
            if (!item) {
                return {
                    error: { status: 404, message: "Story not found" },
                };
            }
            if (item.teacherId !== teacherId) {
                return {
                    error: {
                        status: 403,
                        message: "You can only assign your own stories",
                    },
                };
            }
            return { item };
        }
        case "vocab": {
            const item = await prisma.vocabList.findUnique({
                where: { id: contentId },
                select: { id: true, teacherId: true },
            });
            if (!item) {
                return {
                    error: { status: 404, message: "Vocabulary list not found" },
                };
            }
            if (item.teacherId !== teacherId) {
                return {
                    error: {
                        status: 403,
                        message: "You can only assign your own vocabulary lists",
                    },
                };
            }
            return { item };
        }
        case "pronunciation": {
            const item = await prisma.pronunciationExercise.findUnique({
                where: { id: contentId },
                select: { id: true, teacherId: true },
            });
            if (!item) {
                return {
                    error: {
                        status: 404,
                        message: "Pronunciation exercise not found",
                    },
                };
            }
            if (item.teacherId !== teacherId) {
                return {
                    error: {
                        status: 403,
                        message: "You can only assign your own pronunciation exercises",
                    },
                };
            }
            return { item };
        }
        case "quiz": {
            const item = await prisma.quiz.findUnique({
                where: { id: contentId },
                select: { id: true, teacherId: true },
            });
            if (!item) {
                return {
                    error: { status: 404, message: "Quiz not found" },
                };
            }
            if (item.teacherId !== teacherId) {
                return {
                    error: {
                        status: 403,
                        message: "You can only assign your own quizzes",
                    },
                };
            }
            return { item };
        }
    }
}
async function assignContentToClassroom(classroomId, contentType, contentId) {
    switch (contentType) {
        case "grammar":
            await prisma.classroomGrammar.upsert({
                where: {
                    classroomId_grammarId: {
                        classroomId,
                        grammarId: contentId,
                    },
                },
                update: {},
                create: {
                    classroomId,
                    grammarId: contentId,
                },
            });
            return;
        case "story":
            await prisma.classroomStory.upsert({
                where: {
                    classroomId_storyId: {
                        classroomId,
                        storyId: contentId,
                    },
                },
                update: {},
                create: {
                    classroomId,
                    storyId: contentId,
                },
            });
            return;
        case "vocab":
            await prisma.classroomVocabList.upsert({
                where: {
                    classroomId_vocabListId: {
                        classroomId,
                        vocabListId: contentId,
                    },
                },
                update: {},
                create: {
                    classroomId,
                    vocabListId: contentId,
                },
            });
            return;
        case "pronunciation":
            await prisma.classroomPronunciation.upsert({
                where: {
                    classroomId_exerciseId: {
                        classroomId,
                        exerciseId: contentId,
                    },
                },
                update: {},
                create: {
                    classroomId,
                    exerciseId: contentId,
                },
            });
            return;
        case "quiz":
            await prisma.classroomQuiz.upsert({
                where: {
                    classroomId_quizId: {
                        classroomId,
                        quizId: contentId,
                    },
                },
                update: {},
                create: {
                    classroomId,
                    quizId: contentId,
                },
            });
            return;
    }
}
async function removeContentFromClassroom(classroomId, contentType, contentId) {
    switch (contentType) {
        case "grammar":
            await prisma.classroomGrammar.deleteMany({
                where: {
                    classroomId,
                    grammarId: contentId,
                },
            });
            return;
        case "story":
            await prisma.classroomStory.deleteMany({
                where: {
                    classroomId,
                    storyId: contentId,
                },
            });
            return;
        case "vocab":
            await prisma.classroomVocabList.deleteMany({
                where: {
                    classroomId,
                    vocabListId: contentId,
                },
            });
            return;
        case "pronunciation":
            await prisma.classroomPronunciation.deleteMany({
                where: {
                    classroomId,
                    exerciseId: contentId,
                },
            });
            return;
        case "quiz":
            await prisma.classroomQuiz.deleteMany({
                where: {
                    classroomId,
                    quizId: contentId,
                },
            });
            return;
    }
}
classroomsRouter.get("/teacher", authRequired, teacherOrAdmin, async (req, res, next) => {
    try {
        const classrooms = await prisma.classroom.findMany({
            where: {
                teacherId: req.auth.sub,
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                students: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                createdAt: true,
                            },
                        },
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
            studentsCount: classroom.students.length,
            students: classroom.students.map((row) => ({
                id: row.student.id,
                name: row.student.name,
                email: row.student.email,
                role: row.student.role,
                createdAt: row.student.createdAt,
                joinedAt: row.joinedAt,
            })),
        })));
    }
    catch (error) {
        return next(error);
    }
});
classroomsRouter.get("/student", authRequired, async (req, res, next) => {
    try {
        if (req.auth.role !== "student") {
            return res.status(403).json({ error: "Student role required" });
        }
        const memberships = await prisma.classroomStudent.findMany({
            where: {
                studentId: req.auth.sub,
            },
            orderBy: {
                joinedAt: "desc",
            },
            include: {
                classroom: {
                    include: {
                        teacher: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        return res.json(memberships.map((row) => ({
            id: row.classroom.id,
            name: row.classroom.name,
            code: row.classroom.code,
            createdAt: row.classroom.createdAt,
            joinedAt: row.joinedAt,
            teacher: row.classroom.teacher,
        })));
    }
    catch (error) {
        return next(error);
    }
});
classroomsRouter.get("/:id", authRequired, async (req, res, next) => {
    try {
        const result = await getAccessibleClassroom(req.params.id, req.auth.sub, req.auth.role);
        const resultError = "error" in result ? result.error : undefined;
        if (resultError) {
            return res.status(resultError.status).json({ error: resultError.message });
        }
        const classroom = "classroom" in result ? result.classroom : undefined;
        if (!classroom) {
            return res.status(404).json({ error: "Classroom not found" });
        }
        return res.json({
            id: classroom.id,
            name: classroom.name,
            code: classroom.code,
            createdAt: classroom.createdAt,
            teacher: classroom.teacher,
            studentsCount: classroom.students.length,
            students: classroom.students.map((row) => ({
                id: row.student.id,
                name: row.student.name,
                email: row.student.email,
                role: row.student.role,
                createdAt: row.student.createdAt,
                joinedAt: row.joinedAt,
            })),
        });
    }
    catch (error) {
        return next(error);
    }
});
classroomsRouter.get("/:id/content", authRequired, async (req, res, next) => {
    try {
        const access = await getAccessibleClassroom(req.params.id, req.auth.sub, req.auth.role);
        const accessError = "error" in access ? access.error : undefined;
        if (accessError) {
            return res.status(accessError.status).json({ error: accessError.message });
        }
        const payload = await getClassroomContentPayload(req.params.id);
        if (!payload) {
            return res.status(404).json({ error: "Classroom not found" });
        }
        return res.json(payload);
    }
    catch (error) {
        return next(error);
    }
});
classroomsRouter.post("/", authRequired, teacherOrAdmin, async (req, res, next) => {
    try {
        const input = CreateClassroomSchema.parse(req.body);
        const code = await generateUniqueClassroomCode();
        const classroom = await prisma.classroom.create({
            data: {
                name: input.name,
                code,
                teacherId: req.auth.sub,
            },
        });
        return res.status(201).json(classroom);
    }
    catch (error) {
        return next(error);
    }
});
classroomsRouter.post("/join", authRequired, async (req, res, next) => {
    try {
        if (req.auth.role !== "student") {
            return res.status(403).json({ error: "Only students can join classrooms" });
        }
        const input = JoinClassroomSchema.parse(req.body);
        const classroom = await prisma.classroom.findUnique({
            where: {
                code: input.code.toUpperCase(),
            },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!classroom) {
            return res.status(404).json({ error: "Invalid classroom code" });
        }
        const membership = await prisma.classroomStudent.upsert({
            where: {
                classroomId_studentId: {
                    classroomId: classroom.id,
                    studentId: req.auth.sub,
                },
            },
            update: {},
            create: {
                classroomId: classroom.id,
                studentId: req.auth.sub,
            },
            include: {
                classroom: true,
            },
        });
        return res.status(201).json({
            message: "Joined classroom successfully",
            classroom: {
                id: classroom.id,
                name: classroom.name,
                code: classroom.code,
                teacher: classroom.teacher,
            },
            joinedAt: membership.joinedAt,
        });
    }
    catch (error) {
        return next(error);
    }
});
classroomsRouter.post("/:id/content", authRequired, teacherOrAdmin, async (req, res, next) => {
    try {
        const input = AssignClassroomContentSchema.parse(req.body);
        const classroomResult = await getManageableClassroom(req.params.id, req.auth.sub, req.auth.role);
        const classroomResultError = "error" in classroomResult ? classroomResult.error : undefined;
        if (classroomResultError) {
            return res
                .status(classroomResultError.status)
                .json({ error: classroomResultError.message });
        }
        if (req.auth.role !== "admin") {
            const contentOwnership = await ensureTeacherOwnsContent(req.auth.sub, input.contentType, input.contentId);
            const contentOwnershipError = "error" in contentOwnership ? contentOwnership.error : undefined;
            if (contentOwnershipError) {
                return res
                    .status(contentOwnershipError.status)
                    .json({ error: contentOwnershipError.message });
            }
        }
        await assignContentToClassroom(req.params.id, input.contentType, input.contentId);
        const payload = await getClassroomContentPayload(req.params.id);
        return res.status(201).json({
            message: "Content assigned successfully",
            contentType: input.contentType,
            contentId: input.contentId,
            classroomContent: payload,
        });
    }
    catch (error) {
        return next(error);
    }
});
classroomsRouter.delete("/:id/content", authRequired, teacherOrAdmin, async (req, res, next) => {
    try {
        const input = AssignClassroomContentSchema.parse(req.body);
        const classroomResult = await getManageableClassroom(req.params.id, req.auth.sub, req.auth.role);
        const classroomResultError = "error" in classroomResult ? classroomResult.error : undefined;
        if (classroomResultError) {
            return res
                .status(classroomResultError.status)
                .json({ error: classroomResultError.message });
        }
        await removeContentFromClassroom(req.params.id, input.contentType, input.contentId);
        const payload = await getClassroomContentPayload(req.params.id);
        return res.json({
            message: "Content removed successfully",
            contentType: input.contentType,
            contentId: input.contentId,
            classroomContent: payload,
        });
    }
    catch (error) {
        return next(error);
    }
});
classroomsRouter.delete("/:id", authRequired, teacherOrAdmin, async (req, res, next) => {
    try {
        const classroom = await prisma.classroom.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                teacherId: true,
            },
        });
        if (!classroom) {
            return res.status(404).json({ error: "Classroom not found" });
        }
        if (req.auth.role !== "admin" && classroom.teacherId !== req.auth.sub) {
            return res
                .status(403)
                .json({ error: "You can only delete your own classroom" });
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
