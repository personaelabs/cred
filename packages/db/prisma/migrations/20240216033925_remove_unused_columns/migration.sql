/*
  Warnings:

  - You are about to drop the column `blockNumber` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `logIndex` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `transactionIndex` on the `Group` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Group" DROP COLUMN "blockNumber",
DROP COLUMN "logIndex",
DROP COLUMN "transactionIndex";
