import { prisma } from "../config/prisma.js";

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  console.info("Prisma connected to PostgreSQL successfully.");
}

main()
  .catch((error: unknown) => {
    console.error("Unable to connect Prisma to PostgreSQL.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
