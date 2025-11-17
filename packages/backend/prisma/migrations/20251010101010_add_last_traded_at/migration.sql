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
    "lastTradedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Holding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Holding_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "HoldingAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Holding" ("accountId", "alias", "createdAt", "currency", "currentPrice", "id", "lastTradedAt", "market", "marketValue", "name", "quantity", "source", "symbol", "updatedAt", "userId") SELECT "accountId", "alias", "createdAt", "currency", "currentPrice", "id", "updatedAt", "market", "marketValue", "name", "quantity", "source", "symbol", "updatedAt", "userId" FROM "Holding";
DROP TABLE "Holding";
ALTER TABLE "new_Holding" RENAME TO "Holding";
CREATE INDEX "Holding_userId_idx" ON "Holding"("userId");
CREATE INDEX "Holding_accountId_idx" ON "Holding"("accountId");
CREATE UNIQUE INDEX "Holding_accountId_symbol_key" ON "Holding"("accountId", "symbol");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
