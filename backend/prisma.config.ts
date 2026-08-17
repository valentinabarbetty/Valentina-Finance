import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Prisma CLI uses Supabase's direct endpoint for migrations. The running
  // application uses DATABASE_URL, which may point to Supabase's pooler.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
