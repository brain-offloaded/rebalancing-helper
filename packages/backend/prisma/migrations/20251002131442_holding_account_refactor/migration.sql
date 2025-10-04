/*
  Warnings:

  - You are about to drop the `BrokerageAccount` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `accountId` on table `Holding` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "BrokerageAccount_brokerId_idx";

-- DropIndex
DROP INDEX "BrokerageAccount_userId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BrokerageAccount";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "HoldingAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "syncMode" TEXT NOT NULL,
    "brokerId" TEXT,
    "apiKeyCipher" TEXT,
    "apiKeyIv" TEXT,
    "apiKeyTag" TEXT,
    "apiSecretCipher" TEXT,
    "apiSecretIv" TEXT,
    "apiSecretTag" TEXT,
    CONSTRAINT "HoldingAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HoldingAccount_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Holding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "market" TEXT,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "currentPrice" REAL NOT NULL,
    "marketValue" REAL NOT NULL,
    "averageCost" REAL,
    "currency" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Holding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Holding_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "HoldingAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Holding" ("accountId", "averageCost", "createdAt", "currency", "currentPrice", "id", "lastUpdated", "market", "marketValue", "name", "quantity", "source", "symbol", "updatedAt", "userId") SELECT "accountId", "averageCost", "createdAt", "currency", "currentPrice", "id", "lastUpdated", "market", "marketValue", "name", "quantity", "source", "symbol", "updatedAt", "userId" FROM "Holding";
DROP TABLE "Holding";
ALTER TABLE "new_Holding" RENAME TO "Holding";
CREATE INDEX "Holding_userId_idx" ON "Holding"("userId");
CREATE INDEX "Holding_accountId_idx" ON "Holding"("accountId");
CREATE UNIQUE INDEX "Holding_accountId_symbol_key" ON "Holding"("accountId", "symbol");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "HoldingAccount_userId_idx" ON "HoldingAccount"("userId");

-- CreateIndex
CREATE INDEX "HoldingAccount_brokerId_idx" ON "HoldingAccount"("brokerId");
