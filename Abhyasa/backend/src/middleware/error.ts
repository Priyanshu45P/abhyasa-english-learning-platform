import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export function notFound(req: Request, res: Response) {
  return res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.flatten(),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: "A record with this unique value already exists",
      });
    }

    if (err.code === "P2025") {
      return res.status(404).json({
        error: "Record not found",
      });
    }

    return res.status(400).json({
      error: "Database request failed",
      code: err.code,
    });
  }

  if (err instanceof Error) {
    return res.status(500).json({
      error: err.message || "Internal server error",
    });
  }

  return res.status(500).json({
    error: "Internal server error",
  });
}