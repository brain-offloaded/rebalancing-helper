-- Drop averageCost column from Holding by redefining table
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
    "currency" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Holding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Holding_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "HoldingAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Holding" (
    "id", "userId", "source", "accountId", "market", "symbol", "name", "quantity", "currentPrice", "marketValue", "currency", "lastUpdated", "createdAt", "updatedAt"
) SELECT
    "id", "userId", "source", "accountId", "market", "symbol", "name", "quantity", "currentPrice", "marketValue", "currency", "lastUpdated", "createdAt", "updatedAt"
FROM "Holding";

DROP TABLE "Holding";
ALTER TABLE "new_Holding" RENAME TO "Holding";

CREATE INDEX "Holding_userId_idx" ON "Holding"("userId");
CREATE INDEX "Holding_accountId_idx" ON "Holding"("accountId");
CREATE UNIQUE INDEX "Holding_accountId_symbol_key" ON "Holding"("accountId", "symbol");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
