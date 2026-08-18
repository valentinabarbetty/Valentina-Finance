import type { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service.js";
import { dashboardSummaryQuerySchema } from "../validators/dashboard.js";

export const dashboardController = {
  async summary(request: Request, response: Response): Promise<void> {
    const { month, year } = dashboardSummaryQuerySchema.parse(request.query);
    response.json(await dashboardService.summary(response.locals.userId!, month, year));
  },
};
