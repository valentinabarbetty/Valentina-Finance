import type { Request, Response } from "express";
import { wishlistService } from "../services/wishlist.service.js";
import { idParamSchema, listIdParamSchema, wishlistItemCreateSchema, wishlistItemUpdateSchema, wishlistListCreateSchema, wishlistListUpdateSchema, wishlistPurchaseSchema } from "../validators/wishlist.js";

const userId = (response: Response): string => response.locals.userId!;

export const wishlistController = {
  // Lists
  async createList(request: Request, response: Response): Promise<void> {
    response.status(201).json(await wishlistService.createList(userId(response), wishlistListCreateSchema.parse(request.body)));
  },
  async listLists(_request: Request, response: Response): Promise<void> {
    response.json(await wishlistService.listLists(userId(response)));
  },
  async getOneList(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    response.json(await wishlistService.getOneList(userId(response), id));
  },
  async updateList(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    response.json(await wishlistService.updateList(userId(response), id, wishlistListUpdateSchema.parse(request.body)));
  },
  async removeList(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    await wishlistService.removeList(userId(response), id);
    response.status(204).send();
  },

  // Items
  async createItem(request: Request, response: Response): Promise<void> {
    const { listId } = listIdParamSchema.parse(request.params);
    response.status(201).json(await wishlistService.createItem(userId(response), listId, wishlistItemCreateSchema.parse(request.body)));
  },
  async listItems(request: Request, response: Response): Promise<void> {
    const { listId } = listIdParamSchema.parse(request.params);
    response.json(await wishlistService.listItems(userId(response), listId));
  },
  async getItem(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    response.json(await wishlistService.getItem(userId(response), id));
  },
  async updateItem(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    response.json(await wishlistService.updateItem(userId(response), id, wishlistItemUpdateSchema.parse(request.body)));
  },
  async removeItem(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    await wishlistService.removeItem(userId(response), id);
    response.status(204).send();
  },

  // Purchase
  async purchase(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    response.json(await wishlistService.purchase(userId(response), id, wishlistPurchaseSchema.parse(request.body)));
  },

  // Dashboard
  async summary(_request: Request, response: Response): Promise<void> {
    response.json(await wishlistService.summary(userId(response)));
  },
};
