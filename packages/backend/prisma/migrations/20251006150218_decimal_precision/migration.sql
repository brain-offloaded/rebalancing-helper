/*
  Warnings:

  - You are about to alter the column `currentPrice` on the `Holding` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `marketValue` on the `Holding` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `quantity` on the `Holding` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `currentPrice` on the `MarketSecurity` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.

*/
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
    "alias" TEXT,
    "quantity" DECIMAL NOT NULL,
    "currentPrice" DECIMAL NOT NULL,
    "marketValue" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Holding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Holding_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "HoldingAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Holding" ("accountId", "alias", "createdAt", "currency", "currentPrice", "id", "lastUpdated", "market", "marketValue", "name", "quantity", "source", "symbol", "updatedAt", "userId") SELECT "accountId", "alias", "createdAt", "currency", "currentPrice", "id", "lastUpdated", "market", "marketValue", "name", "quantity", "source", "symbol", "updatedAt", "userId" FROM "Holding";
DROP TABLE "Holding";
ALTER TABLE "new_Holding" RENAME TO "Holding";
CREATE INDEX "Holding_userId_idx" ON "Holding"("userId");
CREATE INDEX "Holding_accountId_idx" ON "Holding"("accountId");
CREATE UNIQUE INDEX "Holding_accountId_symbol_key" ON "Holding"("accountId", "symbol");
CREATE TABLE "new_MarketSecurity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "market" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "currentPrice" DECIMAL NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MarketSecurity" ("createdAt", "currency", "currentPrice", "id", "lastUpdated", "market", "name", "symbol", "updatedAt") SELECT "createdAt", "currency", "currentPrice", "id", "lastUpdated", "market", "name", "symbol", "updatedAt" FROM "MarketSecurity";
DROP TABLE "MarketSecurity";
ALTER TABLE "new_MarketSecurity" RENAME TO "MarketSecurity";
CREATE UNIQUE INDEX "MarketSecurity_market_symbol_key" ON "MarketSecurity"("market", "symbol");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
