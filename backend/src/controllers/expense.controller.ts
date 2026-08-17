import type { Request, Response } from "express";
import { expenseService } from "../services/expense.service.js";
import { serializeTransaction } from "../services/transaction.service.js";
import { idParamSchema } from "../validators/category.js";
import { expenseCreateSchema, expenseUpdateSchema, transactionFilterSchema } from "../validators/transaction.js";

const userId = (response: Response): string => response.locals.userId!;

export const expenseController = {
  async create(request: Request, response: Response): Promise<void> {
    response.status(201).json(serializeTransaction(await expenseService.create(userId(response), expenseCreateSchema.parse(request.body))));
  },
  async list(request: Request, response: Response): Promise<void> {
    const expenses = await expenseService.list(userId(response), transactionFilterSchema.parse(request.query));
    response.json(expenses.map(serializeTransaction));
  },
  async getById(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    response.json(serializeTransaction(await expenseService.getById(userId(response), id)));
  },
  async update(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    response.json(serializeTransaction(await expenseService.update(userId(response), id, expenseUpdateSchema.parse(request.body))));
  },
  async remove(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    await expenseService.softDelete(userId(response), id);
    response.status(204).send();
  },
};
