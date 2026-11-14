-- CreateTable
CREATE TABLE "LifeEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sortOrder" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "StepTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lifeEventId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "deadlineDaysAfterStart" INTEGER,
    "waitWorkingDaysMin" INTEGER,
    "waitWorkingDaysMax" INTEGER,
    "feeCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "dependsOnId" TEXT,
    CONSTRAINT "StepTemplate_lifeEventId_fkey" FOREIGN KEY ("lifeEventId") REFERENCES "LifeEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StepTemplate_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "StepTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "StepRequirement" (
    "stepTemplateId" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,

    PRIMARY KEY ("stepTemplateId", "documentTypeId"),
    CONSTRAINT "StepRequirement_stepTemplateId_fkey" FOREIGN KEY ("stepTemplateId") REFERENCES "StepTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StepRequirement_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Journey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lifeEventId" TEXT NOT NULL,
    "title" TEXT,
    "countryCode" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Journey_lifeEventId_fkey" FOREIGN KEY ("lifeEventId") REFERENCES "LifeEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "journeyId" TEXT NOT NULL,
    "stepTemplateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "submittedAt" DATETIME,
    "reminderAt" DATETIME,
    "rejectionNote" TEXT,
    "note" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Step_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Step_stepTemplateId_fkey" FOREIGN KEY ("stepTemplateId") REFERENCES "StepTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "documentTypeId" TEXT,
    "validUntil" DATETIME,
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "data" BLOB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StepDocument" (
    "stepId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "attachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("stepId", "documentId"),
    CONSTRAINT "StepDocument_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StepDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Correction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stepTemplateId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "disputes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Correction_stepTemplateId_fkey" FOREIGN KEY ("stepTemplateId") REFERENCES "StepTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "StepTemplate_lifeEventId_sortOrder_idx" ON "StepTemplate"("lifeEventId", "sortOrder");

-- CreateIndex
CREATE INDEX "Journey_archivedAt_idx" ON "Journey"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Step_journeyId_stepTemplateId_key" ON "Step"("journeyId", "stepTemplateId");

-- CreateIndex
CREATE INDEX "Correction_stepTemplateId_createdAt_idx" ON "Correction"("stepTemplateId", "createdAt");
