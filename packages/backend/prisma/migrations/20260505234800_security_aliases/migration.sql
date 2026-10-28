-- CreateTable
CREATE TABLE "SecurityAlias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SecurityAlias_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate the latest non-empty row alias for each user/market/symbol.
INSERT INTO "SecurityAlias" ("id", "userId", "market", "symbol", "alias", "createdAt", "updatedAt")
SELECT
    'migrated_' || lower(hex(randomblob(12))),
    "userId",
    "marketKey",
    "symbol",
    "alias",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    SELECT
        "userId",
        COALESCE("market", '') AS "marketKey",
        "symbol",
        trim("alias") AS "alias",
        ROW_NUMBER() OVER (
            PARTITION BY "userId", COALESCE("market", ''), "symbol"
            ORDER BY "updatedAt" DESC, "createdAt" DESC, "id" DESC
        ) AS "rank"
    FROM "Holding"
    WHERE "alias" IS NOT NULL AND trim("alias") <> ''
)
WHERE "rank" = 1;

-- CreateIndex
CREATE INDEX "SecurityAlias_userId_symbol_idx" ON "SecurityAlias"("userId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityAlias_userId_market_symbol_key" ON "SecurityAlias"("userId", "market", "symbol");

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
INSERT INTO "new_Holding" ("accountId", "createdAt", "currency", "currentPrice", "id", "lastTradedAt", "market", "marketValue", "name", "quantity", "source", "symbol", "updatedAt", "userId")
SELECT "accountId", "createdAt", "currency", "currentPrice", "id", "lastTradedAt", "market", "marketValue", "name", "quantity", "source", "symbol", "updatedAt", "userId" FROM "Holding";
DROP TABLE "Holding";
ALTER TABLE "new_Holding" RENAME TO "Holding";
CREATE INDEX "Holding_userId_idx" ON "Holding"("userId");
CREATE INDEX "Holding_accountId_idx" ON "Holding"("accountId");
CREATE UNIQUE INDEX "Holding_accountId_symbol_key" ON "Holding"("accountId", "symbol");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
