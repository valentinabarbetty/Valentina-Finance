import type { Request, Response } from "express";
import { budgetService } from "../services/budget.service.js";
import { idParamSchema } from "../validators/category.js";
import { budgetCreateSchema, budgetUpdateSchema } from "../validators/budget.js";

const userId = (response: Response): string => response.locals.userId!;

export const budgetController = {
  async create(request: Request, response: Response): Promise<void> {
    response.status(201).json(await budgetService.create(userId(response), budgetCreateSchema.parse(request.body)));
  },
  async list(_request: Request, response: Response): Promise<void> {
    response.json(await budgetService.list(userId(response)));
  },
  async getById(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    response.json(await budgetService.getById(userId(response), id));
  },
  async update(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    response.json(await budgetService.update(userId(response), id, budgetUpdateSchema.parse(request.body)));
  },
  async remove(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    await budgetService.remove(userId(response), id);
    response.status(204).send();
  },
};
