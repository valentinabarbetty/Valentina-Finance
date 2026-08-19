import { Router } from "express";
import { budgetController } from "../controllers/budget.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { asyncHandler } from "../utils/async-handler.js";

export const budgetsRouter = Router();
budgetsRouter.use(authenticate);
budgetsRouter.post("/", asyncHandler(budgetController.create));
budgetsRouter.get("/", asyncHandler(budgetController.list));
budgetsRouter.get("/:id", asyncHandler(budgetController.getById));
budgetsRouter.patch("/:id", asyncHandler(budgetController.update));
budgetsRouter.delete("/:id", asyncHandler(budgetController.remove));
