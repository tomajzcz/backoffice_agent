-- AlterTable
ALTER TABLE "scheduled_jobs" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notify_email" TEXT;
