-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('PENDING', 'INITIATED', 'FAILED', 'NO_PHONE', 'SKIPPED');

-- CreateTable
CREATE TABLE "call_logs" (
    "id" SERIAL NOT NULL,
    "showingId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "phoneNormalized" TEXT,
    "status" "CallStatus" NOT NULL DEFAULT 'PENDING',
    "elevenlabs_call_id" TEXT,
    "errorMessage" TEXT,
    "callDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "call_logs_callDate_idx" ON "call_logs"("callDate");

-- CreateIndex
CREATE INDEX "call_logs_showingId_idx" ON "call_logs"("showingId");

-- CreateIndex
CREATE INDEX "call_logs_clientId_idx" ON "call_logs"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "call_logs_showingId_callDate_key" ON "call_logs"("showingId", "callDate");

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_showingId_fkey" FOREIGN KEY ("showingId") REFERENCES "showings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
