import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { asyncHandler } from "../utils/async-handler.js";

export const dashboardRouter = Router();
dashboardRouter.get("/summary", authenticate, asyncHandler(dashboardController.summary));
