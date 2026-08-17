import type { Request, Response } from "express";
import { goalService } from "../services/goal.service.js";
import { idParamSchema } from "../validators/category.js";
import { contributionCreateSchema, contributionUpdateSchema, goalCreateSchema, goalUpdateSchema, subgoalCreateSchema, subgoalUpdateSchema } from "../validators/goal.js";

const userId = (response: Response): string => response.locals.userId!;
const goalId = (request: Request): string => idParamSchema.parse({ id: request.params.goalId }).id;
const id = (request: Request): string => idParamSchema.parse({ id: request.params.id }).id;

export const goalController = {
  async create(request: Request, response: Response): Promise<void> { response.status(201).json(await goalService.create(userId(response), goalCreateSchema.parse(request.body))); },
  async list(_request: Request, response: Response): Promise<void> { response.json(await goalService.list(userId(response))); },
  async getById(request: Request, response: Response): Promise<void> { response.json(await goalService.one(userId(response), id(request))); },
  async update(request: Request, response: Response): Promise<void> { response.json(await goalService.update(userId(response), id(request), goalUpdateSchema.parse(request.body))); },
  async remove(request: Request, response: Response): Promise<void> { await goalService.remove(userId(response), id(request)); response.status(204).send(); },
  async createSubgoal(request: Request, response: Response): Promise<void> { response.status(201).json(await goalService.createSubgoal(userId(response), goalId(request), subgoalCreateSchema.parse(request.body))); },
  async listSubgoals(request: Request, response: Response): Promise<void> { response.json(await goalService.listSubgoals(userId(response), goalId(request))); },
  async getSubgoal(request: Request, response: Response): Promise<void> { response.json(await goalService.subgoal(userId(response), goalId(request), id(request))); },
  async updateSubgoal(request: Request, response: Response): Promise<void> { response.json(await goalService.updateSubgoal(userId(response), goalId(request), id(request), subgoalUpdateSchema.parse(request.body))); },
  async removeSubgoal(request: Request, response: Response): Promise<void> { await goalService.removeSubgoal(userId(response), goalId(request), id(request)); response.status(204).send(); },
  async createContribution(request: Request, response: Response): Promise<void> { response.status(201).json(await goalService.createContribution(userId(response), goalId(request), contributionCreateSchema.parse(request.body))); },
  async listContributions(request: Request, response: Response): Promise<void> { response.json(await goalService.listContributions(userId(response), goalId(request))); },
  async getContribution(request: Request, response: Response): Promise<void> { response.json(await goalService.contribution(userId(response), goalId(request), id(request))); },
  async updateContribution(request: Request, response: Response): Promise<void> { response.json(await goalService.updateContribution(userId(response), goalId(request), id(request), contributionUpdateSchema.parse(request.body))); },
  async removeContribution(request: Request, response: Response): Promise<void> { await goalService.removeContribution(userId(response), goalId(request), id(request)); response.status(204).send(); },
};
