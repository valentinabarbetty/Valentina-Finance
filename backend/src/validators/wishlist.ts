import { z } from "zod";

const optionalText = z.string().trim().min(1).max(500).optional().nullable();
const money = z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must have up to two decimals");
const positiveMoney = money.refine(
  (v) => v !== "0" && v !== "0.0" && v !== "0.00",
  "Amount must be positive",
);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD").refine(
  (value) => new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value,
  "Date is invalid",
);

export const wishlistListCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: optionalText,
  icon: z.string().trim().min(1).max(100).optional().nullable(),
}).strict();

export const wishlistListUpdateSchema = wishlistListCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field is required",
);

export const wishlistItemCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: optionalText,
  estimatedPrice: money.optional().nullable(),
  categoryId: z.string().uuid("Category is required"),
  typeId: z.string().uuid().optional().nullable(),
}).strict();

export const wishlistItemUpdateSchema = wishlistItemCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field is required",
);

export const wishlistPurchaseSchema = z.object({
  actualPrice: positiveMoney,
  date: isoDate,
  categoryId: z.string().uuid("Category is required"),
  typeId: z.string().uuid().optional().nullable(),
}).strict();

export const idParamSchema = z.object({ id: z.string().uuid() });
export const listIdParamSchema = z.object({ listId: z.string().uuid() });
