import "express";

export type AuthRole = "admin" | "teacher" | "student";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        sub: string;
        role: AuthRole;
      };
    }
  }
}

export {};