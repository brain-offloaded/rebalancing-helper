/*
  Warnings:

  - Added the required column `userId` to the `BrokerageAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `HoldingTag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `RebalancingGroup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Tag` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BrokerageAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brokerName" TEXT NOT NULL,
    "description" TEXT,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT,
    "apiBaseUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "BrokerageAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BrokerageAccount" ("apiBaseUrl", "apiKey", "apiSecret", "brokerName", "createdAt", "description", "id", "isActive", "name", "updatedAt") SELECT "apiBaseUrl", "apiKey", "apiSecret", "brokerName", "createdAt", "description", "id", "isActive", "name", "updatedAt" FROM "BrokerageAccount";
DROP TABLE "BrokerageAccount";
ALTER TABLE "new_BrokerageAccount" RENAME TO "BrokerageAccount";
CREATE INDEX "BrokerageAccount_userId_idx" ON "BrokerageAccount"("userId");
CREATE TABLE "new_HoldingTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "holdingSymbol" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "HoldingTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HoldingTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_HoldingTag" ("createdAt", "holdingSymbol", "id", "tagId") SELECT "createdAt", "holdingSymbol", "id", "tagId" FROM "HoldingTag";
DROP TABLE "HoldingTag";
ALTER TABLE "new_HoldingTag" RENAME TO "HoldingTag";
CREATE INDEX "HoldingTag_userId_holdingSymbol_idx" ON "HoldingTag"("userId", "holdingSymbol");
CREATE UNIQUE INDEX "HoldingTag_userId_holdingSymbol_tagId_key" ON "HoldingTag"("userId", "holdingSymbol", "tagId");
CREATE TABLE "new_RebalancingGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "RebalancingGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RebalancingGroup" ("createdAt", "description", "id", "name", "updatedAt") SELECT "createdAt", "description", "id", "name", "updatedAt" FROM "RebalancingGroup";
DROP TABLE "RebalancingGroup";
ALTER TABLE "new_RebalancingGroup" RENAME TO "RebalancingGroup";
CREATE UNIQUE INDEX "RebalancingGroup_userId_name_key" ON "RebalancingGroup"("userId", "name");
CREATE TABLE "new_Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Tag" ("color", "createdAt", "description", "id", "name", "updatedAt") SELECT "color", "createdAt", "description", "id", "name", "updatedAt" FROM "Tag";
DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
