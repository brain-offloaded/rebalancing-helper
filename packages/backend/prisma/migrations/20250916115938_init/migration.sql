-- CreateTable
CREATE TABLE "BrokerageAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brokerName" TEXT NOT NULL,
    "description" TEXT,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT,
    "apiBaseUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HoldingTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "holdingSymbol" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HoldingTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RebalancingGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RebalancingGroupTag" (
    "groupId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("groupId", "tagId"),
    CONSTRAINT "RebalancingGroupTag_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RebalancingGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RebalancingGroupTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TargetAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "targetPercentage" REAL NOT NULL,
    CONSTRAINT "TargetAllocation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RebalancingGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TargetAllocation_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BrokerageHolding_accountId_idx" ON "BrokerageHolding"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "BrokerageHolding_accountId_symbol_key" ON "BrokerageHolding"("accountId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "HoldingTag_holdingSymbol_idx" ON "HoldingTag"("holdingSymbol");

-- CreateIndex
CREATE UNIQUE INDEX "HoldingTag_holdingSymbol_tagId_key" ON "HoldingTag"("holdingSymbol", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "TargetAllocation_groupId_tagId_key" ON "TargetAllocation"("groupId", "tagId");
