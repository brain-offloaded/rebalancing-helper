-- CreateTable
CREATE TABLE "Broker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "apiBaseUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

DROP TABLE IF EXISTS "BrokerageHolding";
DROP TABLE IF EXISTS "BrokerageAccount";

CREATE TABLE "BrokerageAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "apiKeyCipher" TEXT NOT NULL,
    "apiKeyIv" TEXT NOT NULL,
    "apiKeyTag" TEXT NOT NULL,
    "apiSecretCipher" TEXT,
    "apiSecretIv" TEXT,
    "apiSecretTag" TEXT,
    CONSTRAINT "BrokerageAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BrokerageAccount_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "BrokerageHolding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "currentPrice" REAL NOT NULL,
    "marketValue" REAL NOT NULL,
    "averageCost" REAL,
    "currency" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountId" TEXT NOT NULL,
    CONSTRAINT "BrokerageHolding_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BrokerageAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Broker_code_key" ON "Broker"("code");
CREATE INDEX "BrokerageAccount_userId_idx" ON "BrokerageAccount"("userId");
CREATE INDEX "BrokerageAccount_brokerId_idx" ON "BrokerageAccount"("brokerId");
CREATE INDEX "BrokerageHolding_accountId_idx" ON "BrokerageHolding"("accountId");
CREATE UNIQUE INDEX "BrokerageHolding_accountId_symbol_key" ON "BrokerageHolding"("accountId", "symbol");

