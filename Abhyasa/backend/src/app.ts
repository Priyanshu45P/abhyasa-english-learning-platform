import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./lib/env.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { grammarRouter } from "./routes/grammar.js";
import { storiesRouter } from "./routes/stories.js";
import { vocabRouter } from "./routes/vocab.js";
import { quizzesRouter } from "./routes/quizzes.js";
import { progressRouter } from "./routes/progress.js";
import { pronunciationRouter } from "./routes/pronunciation.js";
import { adminRouter } from "./routes/admin.js";
import { classroomsRouter } from "./routes/classrooms.js";
import { notFound, errorHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();

  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(helmet());

  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));

  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/", (_req, res) => {
    res.json({ name: "learning-platform-backend", ok: true });
  });

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/grammar", grammarRouter);
  app.use("/stories", storiesRouter);
  app.use("/vocab", vocabRouter);
  app.use("/quizzes", quizzesRouter);
  app.use("/progress", progressRouter);
  app.use("/pronunciation", pronunciationRouter);
  app.use("/admin", adminRouter);
  app.use("/classrooms", classroomsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}