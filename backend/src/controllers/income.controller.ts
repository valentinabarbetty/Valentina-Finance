import type { Request, Response } from "express";
import { incomeService } from "../services/income.service.js";
import { serializeTransaction } from "../services/transaction.service.js";
import { idParamSchema } from "../validators/category.js";
import { incomeCreateSchema, incomeUpdateSchema, transactionFilterSchema } from "../validators/transaction.js";

const userId = (response: Response): string => response.locals.userId!;

export const incomeController = {
  async create(request: Request, response: Response): Promise<void> {
    response.status(201).json(serializeTransaction(await incomeService.create(userId(response), incomeCreateSchema.parse(request.body))));
  },
  async list(request: Request, response: Response): Promise<void> {
    const incomes = await incomeService.list(userId(response), transactionFilterSchema.parse(request.query));
    response.json(incomes.map(serializeTransaction));
  },
  async getById(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    response.json(serializeTransaction(await incomeService.getById(userId(response), id)));
  },
  async update(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    response.json(serializeTransaction(await incomeService.update(userId(response), id, incomeUpdateSchema.parse(request.body))));
  },
  async remove(request: Request, response: Response): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    await incomeService.softDelete(userId(response), id);
    response.status(204).send();
  },
};
