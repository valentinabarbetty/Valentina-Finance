import type { Request, Response } from "express";
import { transactionTypeService } from "../services/transaction-type.service.js";
import { idParamSchema } from "../validators/category.js";
import { transactionTypeCreateSchema, transactionTypeUpdateSchema } from "../validators/transaction-type.js";

const authenticatedUserId = (response: Response): string => response.locals.userId!;

export const transactionTypeController = {
  async create(request: Request, response: Response): Promise<void> {
    const record = await transactionTypeService.create(authenticatedUserId(response), transactionTypeCreateSchema.parse(request.body));
    response.status(201).json(record);
  },
  async list(_request: Request, response: Response): Promise<void> {
    response.json(await transactionTypeService.list(authenticatedUserId(response)));
  },
  async getById(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    response.json(await transactionTypeService.getById(authenticatedUserId(response), id));
  },
  async update(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    response.json(await transactionTypeService.update(authenticatedUserId(response), id, transactionTypeUpdateSchema.parse(request.body)));
  },
  async remove(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    await transactionTypeService.softDelete(authenticatedUserId(response), id);
    response.status(204).send();
  },
};
