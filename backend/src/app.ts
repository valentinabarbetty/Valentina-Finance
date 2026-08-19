import cors from "cors";
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { prisma } from "./config/prisma.js";
import { authRouter } from "./routes/auth.js";
import { budgetsRouter } from "./routes/budgets.js";
import { categoriesRouter } from "./routes/categories.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { expensesRouter } from "./routes/expenses.js";
import { goalsRouter } from "./routes/goals.js";
import { healthRouter } from "./routes/health.js";
import { incomesRouter } from "./routes/incomes.js";
import { transactionTypesRouter } from "./routes/transaction-types.js";
import { wishlistRouter } from "./routes/wishlist.js";

const app = express();

app.disable("x-powered-by");
app.use(cors({
  origin: [
    "https://valentina-finance.vercel.app",
    "http://localhost:4200",
  ],
  credentials: true,
}));
app.use(helmet());
app.use(express.json());
app.use(healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/transaction-types", transactionTypesRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/incomes", incomesRouter);
app.use("/api/budgets", budgetsRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/wishlist", wishlistRouter);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.info(`Valen Finance API listening on port ${env.PORT}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
