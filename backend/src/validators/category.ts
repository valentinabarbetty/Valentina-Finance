import { z } from "zod";

const optionalText = z.string().trim().min(1).max(500).optional().nullable();

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: optionalText,
  icon: z.string().trim().min(1).max(100).optional().nullable(),
  color: z.string().trim().min(1).max(32).optional().nullable(),
  kind: z.enum(["INCOME", "EXPENSE", "GENERAL"]).optional(),
}).strict();

export const categoryUpdateSchema = categoryCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field is required",
);

export const idParamSchema = z.object({ id: z.string().uuid() });
