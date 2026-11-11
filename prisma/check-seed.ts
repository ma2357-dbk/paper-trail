/** Quick read-back of the seed, used while developing: npx tsx prisma/check-seed.ts */
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" }),
});

async function main() {
  const journey = await prisma.journey.findFirst({
    include: {
      steps: {
        include: {
          stepTemplate: { include: { requirements: true } },
          attachments: { include: { document: true } },
        },
        orderBy: { stepTemplate: { sortOrder: "asc" } },
      },
    },
  });
  console.log(journey?.title, journey?.startedAt.toISOString());
  for (const step of journey?.steps ?? []) {
    console.log(
      " ",
      step.stepTemplate.id.padEnd(32),
      step.status.padEnd(12),
      "needs", step.stepTemplate.requirements.length,
      "attached:", step.attachments.map((a) => a.document.name).join(" | ") || "-",
    );
  }
}

main().finally(() => prisma.$disconnect());
