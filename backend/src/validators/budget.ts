import { z } from "zod";

const money = z.string().regex(/^\d+(\.\d{1,2})?$/).refine(v => !/^0(?:\.0{1,2})?$/.test(v), "Amount must be positive");

export const budgetCreateSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  goalId: z.string().uuid().nullable().optional(),
  isRecurring: z.boolean().optional(),
  month: z.coerce.number().int().min(1).max(12).nullable().optional(),
  year: z.coerce.number().int().min(2000).max(2100).nullable().optional(),
  plannedAmount: money,
}).strict().refine(
  (data) => {
    const hasCat = data.categoryId !== null && data.categoryId !== undefined;
    const hasGoal = data.goalId !== null && data.goalId !== undefined;
    return (hasCat && !hasGoal) || (!hasCat && hasGoal);
  },
  "Must target either a categoryId or a goalId, not both and not neither",
).refine(
  (data) => {
    if (data.isRecurring === false || data.isRecurring === undefined) {
      return data.month !== undefined && data.month !== null && data.year !== undefined && data.year !== null;
    }
    return true;
  },
  "Non-recurring budgets require month and year",
).refine(
  (data) => {
    if (data.isRecurring === true) {
      return data.month === null || data.month === undefined;
    }
    return true;
  },
  "Recurring budgets must not have month/year",
);

export const budgetUpdateSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  goalId: z.string().uuid().nullable().optional(),
  isRecurring: z.boolean().optional(),
  month: z.coerce.number().int().min(1).max(12).nullable().optional(),
  year: z.coerce.number().int().min(2000).max(2100).nullable().optional(),
  plannedAmount: money.optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field is required",
);

export const budgetQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
}).strict();
