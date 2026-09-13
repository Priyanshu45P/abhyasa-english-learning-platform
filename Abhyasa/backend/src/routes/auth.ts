import { Router, type RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";
import { authRequired } from "../middleware/auth.js";

export const authRouter = Router();

/**
 * Simple in-memory login rate limiter.
 * Allows 5 login attempts per 15 minutes per IP + email.
 */
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;

type LoginAttemptRecord = {
  count: number;
  resetAt: number;
};

const loginAttempts = new Map<string, LoginAttemptRecord>();

function getLoginRateLimitKey(req: Parameters<RequestHandler>[0]) {
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.toLowerCase().trim()
      : "unknown-email";

  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown-ip";

  return `login:${ip}:${email}`;
}

const loginRateLimiter: RequestHandler = (req, res, next) => {
  const key = getLoginRateLimitKey(req);
  const now = Date.now();

  const existing = loginAttempts.get(key);

  if (!existing || existing.resetAt <= now) {
    loginAttempts.set(key, {
      count: 1,
      resetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS,
    });

    return next();
  }

  if (existing.count >= LOGIN_RATE_LIMIT_MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);

    res.setHeader("Retry-After", retryAfterSeconds.toString());

    return res.status(429).json({
      error: "Too many login attempts. Please wait 15 minutes and try again.",
    });
  }

  existing.count += 1;
  loginAttempts.set(key, existing);

  return next();
};

function resetLoginRateLimit(req: Parameters<RequestHandler>[0]) {
  const key = getLoginRateLimitKey(req);
  loginAttempts.delete(key);
}

const RegisterSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["teacher", "student"]),
});
//This code hashes the user password before saving the account in the database.
authRouter.post("/register", async (req, res, next) => {
  try {
    const input = RegisterSchema.parse(req.body);
    const email = input.email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
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
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.flatten(),
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Email already registered" });
      }

      return res.status(400).json({
        error: "Database request failed",
        code: error.code,
        meta: error.meta ?? null,
      });
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return res.status(400).json({
        error: "Invalid registration data",
      });
    }

    return next(error);
  }
});

const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});
//This code checks the login password and creates a JWT token with the user ID and role.
authRouter.post("/login", loginRateLimiter, async (req, res, next) => {
  try {
    const input = LoginSchema.parse(req.body);
    const email = input.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Password hash is stored in the database.
    const ok = await bcrypt.compare(input.password, user.passwordHash);

    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    resetLoginRateLimit(req);

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return next(error);
  }
});

authRouter.get("/me", authRequired, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P1001"
    ) {
      return res.status(503).json({
        error: "Database is temporarily unavailable. Please try again in a moment.",
      });
    }

    return next(error);
  }
});