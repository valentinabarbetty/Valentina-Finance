-- Financial Model Redesign Migration (constraints and indexes only)
-- Columns were added in previous partial application attempts.
-- This migration applies the remaining constraints, FK changes, and indexes.

-- Phase 2: TransactionType constraints

-- 2a. Drop old unique index (constraint was already dropped, but the underlying index remains)
DROP INDEX IF EXISTS "transaction_types_userId_kind_name_key";

-- 2b. Add new unique constraint (scoped to category instead of kind)
ALTER TABLE "transaction_types" ADD CONSTRAINT "transaction_types_userId_categoryId_name_key"
  UNIQUE ("userId", "categoryId", "name");

-- 2c. Add index for categoryId lookups
CREATE INDEX "transaction_types_categoryId_idx" ON "transaction_types"("categoryId");

-- Phase 3: Income constraints

-- 3a. Drop existing FK (SET NULL behavior), make NOT NULL, re-add with RESTRICT
ALTER TABLE "incomes" DROP CONSTRAINT "incomes_categoryId_fkey";
ALTER TABLE "incomes" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Phase 4: Budget constraints

-- 4a. XOR constraint: categoryId IS NOT NULL XOR goalId IS NOT NULL
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_target_xor"
  CHECK (
    ("categoryId" IS NOT NULL AND "goalId" IS NULL) OR
    ("categoryId" IS NULL AND "goalId" IS NOT NULL)
  );

-- 4b. Drop the old standard unique index (replaced by partial indexes below)
DROP INDEX IF EXISTS "budgets_userId_categoryId_goalId_month_year_key";

-- 4c. Partial unique indexes for budget uniqueness

-- Non-recurring budgets: one per user + category + month
CREATE UNIQUE INDEX "budget_monthly_category_unique"
  ON "budgets"("userId", "categoryId", "month", "year")
  WHERE "isRecurring" = false AND "categoryId" IS NOT NULL;

-- Non-recurring budgets: one per user + goal + month
CREATE UNIQUE INDEX "budget_monthly_goal_unique"
  ON "budgets"("userId", "goalId", "month", "year")
  WHERE "isRecurring" = false AND "goalId" IS NOT NULL;

-- Recurring budgets: one per user + category
CREATE UNIQUE INDEX "budget_recurring_category_unique"
  ON "budgets"("userId", "categoryId")
  WHERE "isRecurring" = true AND "categoryId" IS NOT NULL;

-- Recurring budgets: one per user + goal
CREATE UNIQUE INDEX "budget_recurring_goal_unique"
  ON "budgets"("userId", "goalId")
  WHERE "isRecurring" = true AND "goalId" IS NOT NULL;
