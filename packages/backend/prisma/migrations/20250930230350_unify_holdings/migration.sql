PRAGMA foreign_keys=off;
DROP TABLE IF EXISTS "BrokerageHolding";
DROP TABLE IF EXISTS "ManualHolding";
PRAGMA foreign_keys=on;

CREATE TABLE "Holding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "accountId" TEXT,
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
    CONSTRAINT "Holding_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BrokerageAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Holding_userId_idx" ON "Holding"("userId");
CREATE INDEX "Holding_accountId_idx" ON "Holding"("accountId");
CREATE UNIQUE INDEX "Holding_accountId_symbol_key" ON "Holding"("accountId", "symbol");
CREATE UNIQUE INDEX "Holding_userId_market_symbol_source_key" ON "Holding"("userId", "market", "symbol", "source");
