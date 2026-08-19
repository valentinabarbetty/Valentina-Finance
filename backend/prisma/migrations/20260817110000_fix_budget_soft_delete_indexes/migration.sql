-- Fix: Partial unique indexes for budgets must respect soft deletes.
-- Without deletedAt IS NULL, soft-deleted rows block recreation of budgets.

DROP INDEX IF EXISTS "budget_monthly_category_unique";
DROP INDEX IF EXISTS "budget_monthly_goal_unique";
DROP INDEX IF EXISTS "budget_recurring_category_unique";
DROP INDEX IF EXISTS "budget_recurring_goal_unique";

-- Non-recurring budgets: one per user + category + month (active only)
CREATE UNIQUE INDEX "budget_monthly_category_unique"
  ON "budgets"("userId", "categoryId", "month", "year")
  WHERE "isRecurring" = false AND "categoryId" IS NOT NULL AND "deletedAt" IS NULL;

-- Non-recurring budgets: one per user + goal + month (active only)
CREATE UNIQUE INDEX "budget_monthly_goal_unique"
  ON "budgets"("userId", "goalId", "month", "year")
  WHERE "isRecurring" = false AND "goalId" IS NOT NULL AND "deletedAt" IS NULL;

-- Recurring budgets: one per user + category (active only)
CREATE UNIQUE INDEX "budget_recurring_category_unique"
  ON "budgets"("userId", "categoryId")
  WHERE "isRecurring" = true AND "categoryId" IS NOT NULL AND "deletedAt" IS NULL;

-- Recurring budgets: one per user + goal (active only)
CREATE UNIQUE INDEX "budget_recurring_goal_unique"
  ON "budgets"("userId", "goalId")
  WHERE "isRecurring" = true AND "goalId" IS NOT NULL AND "deletedAt" IS NULL;
