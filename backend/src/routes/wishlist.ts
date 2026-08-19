import { Router } from "express";
import { wishlistController } from "../controllers/wishlist.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { asyncHandler } from "../utils/async-handler.js";

export const wishlistRouter = Router();
wishlistRouter.use(authenticate);

// Lists
wishlistRouter.post("/lists", asyncHandler(wishlistController.createList));
wishlistRouter.get("/lists", asyncHandler(wishlistController.listLists));
wishlistRouter.get("/lists/:id", asyncHandler(wishlistController.getOneList));
wishlistRouter.patch("/lists/:id", asyncHandler(wishlistController.updateList));
wishlistRouter.delete("/lists/:id", asyncHandler(wishlistController.removeList));

// Items
wishlistRouter.post("/lists/:listId/items", asyncHandler(wishlistController.createItem));
wishlistRouter.get("/lists/:listId/items", asyncHandler(wishlistController.listItems));
wishlistRouter.patch("/items/:id", asyncHandler(wishlistController.updateItem));
wishlistRouter.delete("/items/:id", asyncHandler(wishlistController.removeItem));

// Purchase
wishlistRouter.post("/items/:id/purchase", asyncHandler(wishlistController.purchase));

// Dashboard summary
wishlistRouter.get("/summary", asyncHandler(wishlistController.summary));
