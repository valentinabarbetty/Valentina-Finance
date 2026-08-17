import { Router } from "express";
import { prisma } from "../config/prisma.js";

export const healthRouter = Router();

healthRouter.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

healthRouter.get("/health/database", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.status(200).json({ status: "ok", database: "connected" });
  } catch {
    response.status(503).json({ status: "error", database: "unavailable" });
  }
});
