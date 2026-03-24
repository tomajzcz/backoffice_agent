-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('BYT', 'DUM', 'POZEMEK', 'KOMERCNI');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'IN_NEGOTIATION', 'SOLD', 'RENTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('IN_PROGRESS', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "ClientSegment" AS ENUM ('INVESTOR', 'PRVNI_KUPUJICI', 'UPGRADER', 'DOWNGRADER', 'PRENAJIMATEL');

-- CreateEnum
CREATE TYPE "AcquisitionSource" AS ENUM ('SREALITY', 'BEZREALITKY', 'DOPORUCENI', 'WEB', 'INZERCE', 'LINKEDIN');

-- CreateEnum
CREATE TYPE "ShowingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ERROR');

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "acquisitionSource" "AcquisitionSource" NOT NULL,
    "segment" "ClientSegment" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "source" "AcquisitionSource" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "propertyInterest" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "areaM2" DECIMAL(8,2) NOT NULL,
    "disposition" TEXT,
    "yearBuilt" INTEGER,
    "lastRenovationYear" INTEGER,
    "renovationNotes" TEXT,
    "ownerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "status" "DealStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "value" DECIMAL(12,2) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showings" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "ShowingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "showings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_reports" (
    "id" SERIAL NOT NULL,
    "weekStart" DATE NOT NULL,
    "newLeads" INTEGER NOT NULL,
    "newClients" INTEGER NOT NULL,
    "propertiesListed" INTEGER NOT NULL,
    "dealsClosed" INTEGER NOT NULL,
    "revenue" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_tasks" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "sourceQuery" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_jobs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cronExpr" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "status" "JobStatus" NOT NULL DEFAULT 'ACTIVE',
    "configJson" JSONB NOT NULL,

    CONSTRAINT "scheduled_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_results" (
    "id" SERIAL NOT NULL,
    "jobId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "price" DECIMAL(12,2),
    "district" TEXT,
    "disposition" TEXT,
    "foundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isNew" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "monitoring_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_runs" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userQuery" TEXT NOT NULL,
    "toolsCalledJson" JSONB NOT NULL,
    "outputSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");

-- CreateIndex
CREATE INDEX "clients_createdAt_idx" ON "clients"("createdAt");

-- CreateIndex
CREATE INDEX "clients_acquisitionSource_idx" ON "clients"("acquisitionSource");

-- CreateIndex
CREATE INDEX "leads_createdAt_idx" ON "leads"("createdAt");

-- CreateIndex
CREATE INDEX "leads_source_idx" ON "leads"("source");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_convertedAt_idx" ON "leads"("convertedAt");

-- CreateIndex
CREATE INDEX "properties_district_idx" ON "properties"("district");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE INDEX "properties_createdAt_idx" ON "properties"("createdAt");

-- CreateIndex
CREATE INDEX "properties_lastRenovationYear_idx" ON "properties"("lastRenovationYear");

-- CreateIndex
CREATE INDEX "deals_status_idx" ON "deals"("status");

-- CreateIndex
CREATE INDEX "deals_closedAt_idx" ON "deals"("closedAt");

-- CreateIndex
CREATE INDEX "deals_createdAt_idx" ON "deals"("createdAt");

-- CreateIndex
CREATE INDEX "showings_scheduledAt_idx" ON "showings"("scheduledAt");

-- CreateIndex
CREATE INDEX "showings_status_idx" ON "showings"("status");

-- CreateIndex
CREATE INDEX "weekly_reports_weekStart_idx" ON "weekly_reports"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reports_weekStart_key" ON "weekly_reports"("weekStart");

-- CreateIndex
CREATE INDEX "agent_tasks_status_idx" ON "agent_tasks"("status");

-- CreateIndex
CREATE INDEX "agent_tasks_priority_idx" ON "agent_tasks"("priority");

-- CreateIndex
CREATE INDEX "agent_tasks_createdAt_idx" ON "agent_tasks"("createdAt");

-- CreateIndex
CREATE INDEX "monitoring_results_jobId_idx" ON "monitoring_results"("jobId");

-- CreateIndex
CREATE INDEX "monitoring_results_foundAt_idx" ON "monitoring_results"("foundAt");

-- CreateIndex
CREATE INDEX "monitoring_results_isNew_idx" ON "monitoring_results"("isNew");

-- CreateIndex
CREATE INDEX "agent_runs_sessionId_idx" ON "agent_runs"("sessionId");

-- CreateIndex
CREATE INDEX "agent_runs_createdAt_idx" ON "agent_runs"("createdAt");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showings" ADD CONSTRAINT "showings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showings" ADD CONSTRAINT "showings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_results" ADD CONSTRAINT "monitoring_results_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "scheduled_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
