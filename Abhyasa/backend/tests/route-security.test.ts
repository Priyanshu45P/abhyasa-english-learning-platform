import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    grammarLesson: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    classroom: {
      findMany: vi.fn(),
    },
    quizAttempt: {
      findMany: vi.fn(),
    },
    pronunciationAttempt: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../src/lib/prisma.js", () => ({
  prisma: prismaMock,
}));

const { createApp } = await import("../src/app.js");

function makeToken(role: "admin" | "teacher" | "student", sub = `${role}-1`) {
  return jwt.sign(
    {
      sub,
      role,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "1h",
    }
  );
}

describe("route security", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects protected routes without a bearer token", async () => {
    const response = await request(app).get("/grammar").expect(401);

    expect(response.body.error).toBe("Missing bearer token");
  });

  it("rejects teacher-only content creation for students", async () => {
    const studentToken = makeToken("student", "student-1");

    const response = await request(app)
      .post("/grammar")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        title: "Past Simple",
        content: "Past simple is used for completed actions.",
        level: "beginner",
        tags: ["grammar"],
      })
      .expect(403);

    expect(response.body.error).toBe("Teacher or admin role required");
    expect(prismaMock.grammarLesson.create).not.toHaveBeenCalled();
  });

  it("allows teachers to create grammar lessons", async () => {
    const teacherToken = makeToken("teacher", "teacher-1");

    prismaMock.grammarLesson.create.mockResolvedValueOnce({
      id: "grammar-1",
      title: "Past Simple",
      content: "Past simple is used for completed actions.",
      level: "beginner",
      teacherId: "teacher-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      tags: [],
    });

    const response = await request(app)
      .post("/grammar")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({
        title: "Past Simple",
        content: "Past simple is used for completed actions.",
        level: "beginner",
        tags: [],
      })
      .expect(201);

    expect(response.body.id).toBe("grammar-1");
    expect(response.body.teacherId).toBe("teacher-1");

    expect(prismaMock.grammarLesson.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Past Simple",
          teacherId: "teacher-1",
        }),
      })
    );
  });

  it("rejects admin-only routes for teachers", async () => {
    const teacherToken = makeToken("teacher", "teacher-1");

    const response = await request(app)
      .get("/admin/stats")
      .set("Authorization", `Bearer ${teacherToken}`)
      .expect(403);

    expect(response.body.error).toBe("Admin role required");
  });

  it("rejects teacher progress dashboard access for students", async () => {
    const studentToken = makeToken("student", "student-1");

    const response = await request(app)
      .get("/progress/teacher")
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(403);

    expect(response.body.error).toBe("Teacher or admin role required");
  });
});

describe("login rate limiting", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks repeated login attempts after the configured limit", async () => {
    const email = `rate-limit-${Date.now()}@example.com`;

    const passwordHash = await bcrypt.hash("correct-password", 4);

    prismaMock.user.findUnique.mockResolvedValue({
      id: "student-1",
      name: "Test Student",
      email,
      role: "student",
      passwordHash,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    for (let i = 0; i < 5; i += 1) {
      await request(app)
        .post("/auth/login")
        .send({
          email,
          password: "wrong-password",
        })
        .expect(401);
    }

    const response = await request(app)
      .post("/auth/login")
      .send({
        email,
        password: "wrong-password",
      })
      .expect(429);

    expect(response.body.error).toBe(
      "Too many login attempts. Please wait 15 minutes and try again."
    );

    expect(response.headers["retry-after"]).toBeDefined();
  });
});