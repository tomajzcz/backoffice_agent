-- CreateTable
CREATE TABLE "file_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT '',
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_tokens_token_key" ON "file_tokens"("token");

-- CreateIndex
CREATE INDEX "file_tokens_token_idx" ON "file_tokens"("token");

-- CreateIndex
CREATE INDEX "file_tokens_expiresAt_idx" ON "file_tokens"("expiresAt");
