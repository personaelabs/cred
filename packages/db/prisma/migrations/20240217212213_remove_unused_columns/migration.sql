/*
  Warnings:

  - You are about to drop the column `coingeckoId` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `decimals` on the `Contract` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "coingeckoId",
DROP COLUMN "decimals";
