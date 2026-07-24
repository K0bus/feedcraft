-- AlterTable subscriptions
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "guildId" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "guildIcon" TEXT;

-- AlterTable news_caches
ALTER TABLE "news_caches" ADD COLUMN IF NOT EXISTS "modelUsed" TEXT;

-- AlterTable dispatch_logs
ALTER TABLE "dispatch_logs" ADD COLUMN IF NOT EXISTS "modelUsed" TEXT;

-- CreateTable user_guilds
CREATE TABLE IF NOT EXISTS "user_guilds" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "permissions" TEXT,
    "owner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_guilds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_guilds_userId_guildId_key" ON "user_guilds"("userId", "guildId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_guilds_userId_fkey'
    ) THEN
        ALTER TABLE "user_guilds" ADD CONSTRAINT "user_guilds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
