-- AlterTable
ALTER TABLE "games" ADD COLUMN     "artworkUrl" TEXT;

-- CreateTable
CREATE TABLE "dispatch_logs" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "newsFeedId" TEXT NOT NULL,
    "translatedTitle" TEXT,
    "translatedContent" TEXT,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispatch_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dispatch_logs_subscriptionId_newsFeedId_key" ON "dispatch_logs"("subscriptionId", "newsFeedId");

-- AddForeignKey
ALTER TABLE "dispatch_logs" ADD CONSTRAINT "dispatch_logs_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_logs" ADD CONSTRAINT "dispatch_logs_newsFeedId_fkey" FOREIGN KEY ("newsFeedId") REFERENCES "news_feeds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
