-- CreateEnum
CREATE TYPE "LifecycleStage" AS ENUM ('ACQUISITION', 'IN_RENOVATION', 'READY_FOR_SALE', 'LISTED', 'SOLD');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('KUPNI_SMLOUVA', 'NAVRH_NA_VKLAD', 'ZNALECKY_POSUDEK', 'ENERGETICKY_STITEK', 'LIST_VLASTNICTVI', 'FOTODOKUMENTACE', 'OSTATNI');

-- AlterTable
ALTER TABLE "agent_tasks" ADD COLUMN     "assignee" TEXT,
ADD COLUMN     "dealId" INTEGER,
ADD COLUMN     "propertyId" INTEGER;

-- AlterTable
ALTER TABLE "monitoring_results" ADD COLUMN     "areaM2" DECIMAL(8,2),
ADD COLUMN     "pricePerM2" DECIMAL(10,2),
ADD COLUMN     "score" INTEGER DEFAULT 0,
ADD COLUMN     "scoreReason" TEXT;

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "expectedSalePrice" DECIMAL(12,2),
ADD COLUMN     "lifecycleStage" "LifecycleStage",
ADD COLUMN     "purchasePrice" DECIMAL(12,2),
ADD COLUMN     "renovationCost" DECIMAL(12,2),
ADD COLUMN     "stageChangedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "investors" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "notes" TEXT,
    "clientId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_properties" (
    "id" SERIAL NOT NULL,
    "investorId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "investedAmount" DECIMAL(12,2),
    "notes" TEXT,

    CONSTRAINT "investor_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "type" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "investors_email_key" ON "investors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "investors_clientId_key" ON "investors"("clientId");

-- CreateIndex
CREATE INDEX "investors_createdAt_idx" ON "investors"("createdAt");

-- CreateIndex
CREATE INDEX "investor_properties_investorId_idx" ON "investor_properties"("investorId");

-- CreateIndex
CREATE INDEX "investor_properties_propertyId_idx" ON "investor_properties"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "investor_properties_investorId_propertyId_key" ON "investor_properties"("investorId", "propertyId");

-- CreateIndex
CREATE INDEX "documents_propertyId_idx" ON "documents"("propertyId");

-- CreateIndex
CREATE INDEX "documents_type_idx" ON "documents"("type");

-- CreateIndex
CREATE INDEX "agent_tasks_dueDate_idx" ON "agent_tasks"("dueDate");

-- CreateIndex
CREATE INDEX "agent_tasks_propertyId_idx" ON "agent_tasks"("propertyId");

-- CreateIndex
CREATE INDEX "agent_tasks_dealId_idx" ON "agent_tasks"("dealId");

-- CreateIndex
CREATE INDEX "monitoring_results_score_idx" ON "monitoring_results"("score");

-- CreateIndex
CREATE INDEX "properties_lifecycleStage_idx" ON "properties"("lifecycleStage");

-- AddForeignKey
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investors" ADD CONSTRAINT "investors_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_properties" ADD CONSTRAINT "investor_properties_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_properties" ADD CONSTRAINT "investor_properties_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
