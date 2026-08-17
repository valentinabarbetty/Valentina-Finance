-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TransactionKind" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "CategoryKind" AS ENUM ('INCOME', 'EXPENSE', 'GENERAL');
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');
CREATE TYPE "DebtDirection" AS ENUM ('I_OWE', 'OWED_TO_ME');
CREATE TYPE "DebtStatus" AS ENUM ('ACTIVE', 'PAID', 'OVERDUE', 'CANCELLED');
CREATE TYPE "RecurrenceFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL, "email" TEXT NOT NULL, "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'COP', "monthlyIncomeApprox" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, "deletedAt" TIMESTAMP(3),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transaction_types" (
    "id" UUID NOT NULL, "userId" UUID NOT NULL, "kind" "TransactionKind" NOT NULL,
    "name" TEXT NOT NULL, "icon" TEXT, "color" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, "deletedAt" TIMESTAMP(3),
    CONSTRAINT "transaction_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "categories" (
    "id" UUID NOT NULL, "userId" UUID NOT NULL, "name" TEXT NOT NULL, "description" TEXT,
    "kind" "CategoryKind" NOT NULL DEFAULT 'GENERAL', "icon" TEXT, "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, "deletedAt" TIMESTAMP(3),
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "goals" (
    "id" UUID NOT NULL, "userId" UUID NOT NULL, "categoryId" UUID, "name" TEXT NOT NULL,
    "description" TEXT, "targetAmount" DECIMAL(14,2) NOT NULL, "startDate" DATE, "targetDate" DATE,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM', "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "icon" TEXT, "color" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, "deletedAt" TIMESTAMP(3),
    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subgoals" (
    "id" UUID NOT NULL, "userId" UUID NOT NULL, "goalId" UUID NOT NULL, "name" TEXT NOT NULL,
    "targetAmount" DECIMAL(14,2) NOT NULL, "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "referenceUrl" TEXT, "icon" TEXT, "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3), CONSTRAINT "subgoals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "goal_contributions" (
    "id" UUID NOT NULL, "userId" UUID NOT NULL, "goalId" UUID NOT NULL, "subgoalId" UUID,
    "amount" DECIMAL(14,2) NOT NULL, "date" DATE NOT NULL, "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3), CONSTRAINT "goal_contributions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expenses" (
    "id" UUID NOT NULL, "userId" UUID NOT NULL, "categoryId" UUID NOT NULL, "typeId" UUID,
    "amount" DECIMAL(14,2) NOT NULL, "description" TEXT, "date" DATE NOT NULL, "notes" TEXT,
    "recurringExpenseId" UUID, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, "deletedAt" TIMESTAMP(3),
    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "incomes" (
    "id" UUID NOT NULL, "userId" UUID NOT NULL, "categoryId" UUID, "typeId" UUID,
    "amount" DECIMAL(14,2) NOT NULL, "description" TEXT, "date" DATE NOT NULL, "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3), CONSTRAINT "incomes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "budgets" (
    "id" UUID NOT NULL, "userId" UUID NOT NULL, "categoryId" UUID, "goalId" UUID,
    "month" INTEGER NOT NULL, "year" INTEGER NOT NULL, "plannedAmount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3), CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recurring_expenses" (
    "id" UUID NOT NULL, "userId" UUID NOT NULL, "categoryId" UUID NOT NULL, "name" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL, "frequency" "RecurrenceFrequency" NOT NULL DEFAULT 'MONTHLY',
    "startDate" DATE NOT NULL, "nextOccurrenceDate" DATE NOT NULL, "lastGeneratedDate" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, "deletedAt" TIMESTAMP(3),
    CONSTRAINT "recurring_expenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "debts" (
    "id" UUID NOT NULL, "userId" UUID NOT NULL, "name" TEXT NOT NULL,
    "direction" "DebtDirection" NOT NULL DEFAULT 'I_OWE', "originalAmount" DECIMAL(14,2) NOT NULL,
    "dueDate" DATE, "description" TEXT, "status" "DebtStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3), CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "debt_payments" (
    "id" UUID NOT NULL, "userId" UUID NOT NULL, "debtId" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL, "date" DATE NOT NULL, "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3), CONSTRAINT "debt_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "transaction_types_userId_idx" ON "transaction_types"("userId");
CREATE UNIQUE INDEX "transaction_types_userId_kind_name_key" ON "transaction_types"("userId", "kind", "name");
CREATE INDEX "categories_userId_idx" ON "categories"("userId");
CREATE UNIQUE INDEX "categories_userId_name_key" ON "categories"("userId", "name");
CREATE INDEX "goals_userId_idx" ON "goals"("userId");
CREATE INDEX "goals_userId_status_idx" ON "goals"("userId", "status");
CREATE INDEX "subgoals_userId_idx" ON "subgoals"("userId");
CREATE INDEX "subgoals_goalId_idx" ON "subgoals"("goalId");
CREATE INDEX "goal_contributions_userId_idx" ON "goal_contributions"("userId");
CREATE INDEX "goal_contributions_goalId_date_idx" ON "goal_contributions"("goalId", "date");
CREATE INDEX "goal_contributions_subgoalId_idx" ON "goal_contributions"("subgoalId");
CREATE INDEX "expenses_userId_date_idx" ON "expenses"("userId", "date");
CREATE INDEX "expenses_categoryId_idx" ON "expenses"("categoryId");
CREATE INDEX "incomes_userId_date_idx" ON "incomes"("userId", "date");
CREATE INDEX "budgets_userId_year_month_idx" ON "budgets"("userId", "year", "month");
CREATE UNIQUE INDEX "budgets_userId_categoryId_goalId_month_year_key" ON "budgets"("userId", "categoryId", "goalId", "month", "year");
CREATE INDEX "recurring_expenses_userId_idx" ON "recurring_expenses"("userId");
CREATE INDEX "recurring_expenses_isActive_nextOccurrenceDate_idx" ON "recurring_expenses"("isActive", "nextOccurrenceDate");
CREATE INDEX "debts_userId_status_idx" ON "debts"("userId", "status");
CREATE INDEX "debt_payments_userId_idx" ON "debt_payments"("userId");
CREATE INDEX "debt_payments_debtId_date_idx" ON "debt_payments"("debtId", "date");

-- AddForeignKey
ALTER TABLE "transaction_types" ADD CONSTRAINT "transaction_types_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "categories" ADD CONSTRAINT "categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goals" ADD CONSTRAINT "goals_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "subgoals" ADD CONSTRAINT "subgoals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subgoals" ADD CONSTRAINT "subgoals_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_subgoalId_fkey" FOREIGN KEY ("subgoalId") REFERENCES "subgoals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "transaction_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recurringExpenseId_fkey" FOREIGN KEY ("recurringExpenseId") REFERENCES "recurring_expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "transaction_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "debts" ADD CONSTRAINT "debts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
