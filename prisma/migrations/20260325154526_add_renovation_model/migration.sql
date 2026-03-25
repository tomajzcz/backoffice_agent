-- CreateEnum
CREATE TYPE "RenovationPhase" AS ENUM ('PLANNING', 'DEMOLITION', 'ROUGH_WORK', 'INSTALLATIONS', 'SURFACES', 'FINISHING', 'READY_FOR_HANDOVER', 'COMPLETED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "RenovationStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ON_HOLD');

-- AlterTable
ALTER TABLE "agent_tasks" ADD COLUMN     "renovationId" INTEGER;

-- CreateTable
CREATE TABLE "renovations" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "phase" "RenovationPhase" NOT NULL DEFAULT 'PLANNING',
    "status" "RenovationStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plannedEndAt" TIMESTAMP(3),
    "actualEndAt" TIMESTAMP(3),
    "nextStep" TEXT,
    "blockers" TEXT,
    "ownerName" TEXT,
    "contractorName" TEXT,
    "budgetPlanned" DECIMAL(12,2),
    "budgetActual" DECIMAL(12,2),
    "isDelayed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "renovations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "renovations_propertyId_idx" ON "renovations"("propertyId");

-- CreateIndex
CREATE INDEX "renovations_status_idx" ON "renovations"("status");

-- CreateIndex
CREATE INDEX "renovations_phase_idx" ON "renovations"("phase");

-- CreateIndex
CREATE INDEX "renovations_isDelayed_idx" ON "renovations"("isDelayed");

-- CreateIndex
CREATE INDEX "agent_tasks_renovationId_idx" ON "agent_tasks"("renovationId");

-- AddForeignKey
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_renovationId_fkey" FOREIGN KEY ("renovationId") REFERENCES "renovations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renovations" ADD CONSTRAINT "renovations_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
