-- AlterTable
ALTER TABLE "news_feeds" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "system_configs" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("key")
);
