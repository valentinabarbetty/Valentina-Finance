import { Router } from "express";
import { expenseController } from "../controllers/expense.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { asyncHandler } from "../utils/async-handler.js";

export const expensesRouter = Router();
expensesRouter.use(authenticate);
expensesRouter.post("/", asyncHandler(expenseController.create));
expensesRouter.get("/", asyncHandler(expenseController.list));
expensesRouter.get("/:id", asyncHandler(expenseController.getById));
expensesRouter.patch("/:id", asyncHandler(expenseController.update));
expensesRouter.delete("/:id", asyncHandler(expenseController.remove));
