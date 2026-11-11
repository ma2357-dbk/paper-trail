/**
 * Seed: the catalogue (life events, steps, document types, requirements)
 * plus one example journey and a few wallet documents so a reviewer sees
 * something meaningful right away. No real personal data.
 *
 * Run with: npx prisma db seed   (also runs after `prisma migrate reset`)
 */
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

const documentTypes = [
  "id-card",
  "passport",
  "lease-contract",
  "proof-of-address",
  "photo",
  "employment-contract",
  "enrolment-confirmation",
  "birth-certificate",
  "oib-certificate",
  "health-insurance-card",
];

type StepSeed = {
  slug: string;
  deadlineDaysAfterStart?: number;
  waitWorkingDaysMin?: number;
  waitWorkingDaysMax?: number;
  feeCents?: number;
  dependsOn?: string;
  requires: string[];
};

const lifeEvents: Array<{ id: string; steps: StepSeed[] }> = [
  {
    id: "move-abroad",
    steps: [
      { slug: "get-oib", deadlineDaysAfterStart: 14, waitWorkingDaysMin: 1, waitWorkingDaysMax: 3, feeCents: 0, requires: ["passport"] },
      { slug: "register-address", deadlineDaysAfterStart: 30, waitWorkingDaysMin: 5, waitWorkingDaysMax: 10, feeCents: 0, dependsOn: "get-oib", requires: ["id-card", "lease-contract", "proof-of-address"] },
      { slug: "residence-permit", deadlineDaysAfterStart: 90, waitWorkingDaysMin: 20, waitWorkingDaysMax: 40, feeCents: 7000, dependsOn: "register-address", requires: ["passport", "photo", "employment-contract", "proof-of-address"] },
      { slug: "health-insurance", deadlineDaysAfterStart: 30, waitWorkingDaysMin: 3, waitWorkingDaysMax: 7, feeCents: 0, dependsOn: "get-oib", requires: ["oib-certificate", "employment-contract"] },
      { slug: "open-bank-account", waitWorkingDaysMin: 1, waitWorkingDaysMax: 5, feeCents: 0, dependsOn: "get-oib", requires: ["passport", "oib-certificate", "proof-of-address"] },
    ],
  },
  {
    id: "start-university",
    steps: [
      { slug: "enrol", deadlineDaysAfterStart: 21, waitWorkingDaysMin: 1, waitWorkingDaysMax: 5, feeCents: 0, requires: ["id-card", "photo", "birth-certificate"] },
      { slug: "student-id", waitWorkingDaysMin: 5, waitWorkingDaysMax: 10, feeCents: 1200, dependsOn: "enrol", requires: ["enrolment-confirmation", "photo"] },
      { slug: "temporary-residence", deadlineDaysAfterStart: 30, waitWorkingDaysMin: 5, waitWorkingDaysMax: 10, feeCents: 0, dependsOn: "enrol", requires: ["id-card", "lease-contract", "enrolment-confirmation"] },
      { slug: "student-health-insurance", deadlineDaysAfterStart: 60, waitWorkingDaysMin: 3, waitWorkingDaysMax: 7, feeCents: 0, dependsOn: "enrol", requires: ["enrolment-confirmation", "oib-certificate"] },
    ],
  },
];

async function main() {
  for (const id of documentTypes) {
    await prisma.documentType.upsert({ where: { id }, update: {}, create: { id } });
  }

  for (const [eventIndex, event] of lifeEvents.entries()) {
    await prisma.lifeEvent.upsert({
      where: { id: event.id },
      update: { sortOrder: eventIndex },
      create: { id: event.id, sortOrder: eventIndex },
    });

    for (const [stepIndex, step] of event.steps.entries()) {
      const id = `${event.id}.${step.slug}`;
      const data = {
        lifeEventId: event.id,
        sortOrder: stepIndex,
        deadlineDaysAfterStart: step.deadlineDaysAfterStart ?? null,
        waitWorkingDaysMin: step.waitWorkingDaysMin ?? null,
        waitWorkingDaysMax: step.waitWorkingDaysMax ?? null,
        feeCents: step.feeCents ?? null,
        dependsOnId: step.dependsOn ? `${event.id}.${step.dependsOn}` : null,
      };
      await prisma.stepTemplate.upsert({ where: { id }, update: data, create: { id, ...data } });
      await prisma.stepRequirement.deleteMany({ where: { stepTemplateId: id } });
      await prisma.stepRequirement.createMany({
        data: step.requires.map((documentTypeId) => ({ stepTemplateId: id, documentTypeId })),
      });
    }
  }

  // Example user data (only when the wallet is empty, so re-seeding does not duplicate).
  if ((await prisma.document.count()) === 0) {
    const idCard = await prisma.document.create({
      data: { name: "Osobna iskaznica · Ивана Šimunić", documentTypeId: "id-card", validUntil: new Date("2031-03-14T00:00:00Z") },
    });
    const lease = await prisma.document.create({
      data: { name: "Ugovor o najmu – Savska cesta 41", documentTypeId: "lease-contract" },
    });
    await prisma.document.create({
      data: { name: "Putovnica", documentTypeId: "passport", validUntil: new Date("2029-08-01T00:00:00Z") },
    });

    const journey = await prisma.journey.create({
      data: {
        lifeEventId: "move-abroad",
        title: "Selidba u Zagreb",
        countryCode: "HR",
        startedAt: new Date("2026-10-26T09:00:00Z"),
      },
    });
    const templates = await prisma.stepTemplate.findMany({ where: { lifeEventId: "move-abroad" }, orderBy: { sortOrder: "asc" } });
    for (const template of templates) {
      const status =
        template.id === "move-abroad.get-oib" ? "DONE" :
        template.id === "move-abroad.register-address" ? "SUBMITTED" : "NOT_STARTED";
      const step = await prisma.step.create({
        data: {
          journeyId: journey.id,
          stepTemplateId: template.id,
          status,
          submittedAt: status === "SUBMITTED" ? new Date("2026-11-04T10:30:00Z") : null,
          reminderAt: status === "SUBMITTED" ? new Date("2026-11-18T08:00:00Z") : null,
        },
      });
      if (template.id === "move-abroad.register-address") {
        await prisma.stepDocument.createMany({
          data: [
            { stepId: step.id, documentId: idCard.id },
            { stepId: step.id, documentId: lease.id },
          ],
        });
      }
    }

    await prisma.correction.create({
      data: {
        stepTemplateId: "move-abroad.register-address",
        text: "Office moved to Savska 41, 2nd floor",
        confirmations: 2,
        createdAt: new Date("2026-11-02T12:00:00Z"),
      },
    });
  }

  const counts = {
    lifeEvents: await prisma.lifeEvent.count(),
    stepTemplates: await prisma.stepTemplate.count(),
    documentTypes: await prisma.documentType.count(),
    journeys: await prisma.journey.count(),
    documents: await prisma.document.count(),
  };
  console.log("Seeded:", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
