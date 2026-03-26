-- CreateEnum
CREATE TYPE "ExecutiveReportStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "automation_configs" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "recipient_email" TEXT NOT NULL,
    "cron_expr" TEXT NOT NULL,
    "config_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_report_runs" (
    "id" SERIAL NOT NULL,
    "status" "ExecutiveReportStatus" NOT NULL DEFAULT 'RUNNING',
    "trigger" TEXT NOT NULL DEFAULT 'cron',
    "recipient_email" TEXT NOT NULL,
    "slide_count" INTEGER,
    "pptx_token" TEXT,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executive_report_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "automation_configs_key_key" ON "automation_configs"("key");

-- CreateIndex
CREATE INDEX "executive_report_runs_started_at_idx" ON "executive_report_runs"("started_at");

-- CreateIndex
CREATE INDEX "executive_report_runs_status_idx" ON "executive_report_runs"("status");
