import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../lib/env.js";

export type JwtPayload = {
  sub: string;
  role: "admin" | "teacher" | "student";
};

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function teacherOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.auth.role !== "teacher" && req.auth.role !== "admin") {
    return res.status(403).json({ error: "Teacher or admin role required" });
  }

  return next();
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.auth.role !== "admin") {
    return res.status(403).json({ error: "Admin role required" });
  }

  return next();
}