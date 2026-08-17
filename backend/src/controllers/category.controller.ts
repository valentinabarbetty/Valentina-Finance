import type { Request, Response } from "express";
import { categoryService } from "../services/category.service.js";
import { idParamSchema, categoryCreateSchema, categoryUpdateSchema } from "../validators/category.js";

const authenticatedUserId = (response: Response): string => response.locals.userId!;

export const categoryController = {
  async create(request: Request, response: Response): Promise<void> {
    const category = await categoryService.create(authenticatedUserId(response), categoryCreateSchema.parse(request.body));
    response.status(201).json(category);
  },
  async list(_request: Request, response: Response): Promise<void> {
    response.json(await categoryService.list(authenticatedUserId(response)));
  },
  async getById(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    response.json(await categoryService.getById(authenticatedUserId(response), id));
  },
  async update(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    response.json(await categoryService.update(authenticatedUserId(response), id, categoryUpdateSchema.parse(request.body)));
  },
  async remove(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    await categoryService.softDelete(authenticatedUserId(response), id);
    response.status(204).send();
  },
};
