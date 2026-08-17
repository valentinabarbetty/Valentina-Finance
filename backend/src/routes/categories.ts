import { Router } from "express";
import { categoryController } from "../controllers/category.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { asyncHandler } from "../utils/async-handler.js";

export const categoriesRouter = Router();

categoriesRouter.use(authenticate);
categoriesRouter.post("/", asyncHandler(categoryController.create));
categoriesRouter.get("/", asyncHandler(categoryController.list));
categoriesRouter.get("/:id", asyncHandler(categoryController.getById));
categoriesRouter.patch("/:id", asyncHandler(categoryController.update));
categoriesRouter.delete("/:id", asyncHandler(categoryController.remove));
