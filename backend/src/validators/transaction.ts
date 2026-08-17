import { z } from "zod";

const money = z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must have up to two decimals").refine(
  (value) => value !== "0" && value !== "0.0" && value !== "0.00",
  "Amount must be positive",
);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD").refine(
  (value) => new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value,
  "Date is invalid",
);

const optionalText = z.string().trim().min(1).max(500).nullable().optional();
const optionalId = z.string().uuid().nullable().optional();

export const expenseCreateSchema = z.object({
  amount: money,
  date: isoDate,
  description: optionalText,
  notes: optionalText,
  categoryId: z.string().uuid(),
  typeId: optionalId,
}).strict();

export const expenseUpdateSchema = expenseCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field is required",
);

export const incomeCreateSchema = z.object({
  amount: money,
  date: isoDate,
  description: optionalText,
  notes: optionalText,
  categoryId: optionalId,
  typeId: optionalId,
}).strict();

export const incomeUpdateSchema = incomeCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field is required",
);

export const transactionFilterSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  categoryId: z.string().uuid().optional(),
  transactionTypeId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
}).refine(
  (data) => (data.month === undefined) === (data.year === undefined),
  "month and year must be used together",
);
