import { Router } from "express";
import { transactionTypeController } from "../controllers/transaction-type.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { asyncHandler } from "../utils/async-handler.js";

export const transactionTypesRouter = Router();

transactionTypesRouter.use(authenticate);
transactionTypesRouter.post("/", asyncHandler(transactionTypeController.create));
transactionTypesRouter.get("/", asyncHandler(transactionTypeController.list));
transactionTypesRouter.get("/:id", asyncHandler(transactionTypeController.getById));
transactionTypesRouter.patch("/:id", asyncHandler(transactionTypeController.update));
transactionTypesRouter.delete("/:id", asyncHandler(transactionTypeController.remove));
