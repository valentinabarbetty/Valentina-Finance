import { Router } from "express";
import { incomeController } from "../controllers/income.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { asyncHandler } from "../utils/async-handler.js";

export const incomesRouter = Router();
incomesRouter.use(authenticate);
incomesRouter.post("/", asyncHandler(incomeController.create));
incomesRouter.get("/", asyncHandler(incomeController.list));
incomesRouter.get("/:id", asyncHandler(incomeController.getById));
incomesRouter.patch("/:id", asyncHandler(incomeController.update));
incomesRouter.delete("/:id", asyncHandler(incomeController.remove));
