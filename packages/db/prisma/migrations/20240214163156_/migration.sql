/*
  Warnings:

  - You are about to drop the `ERC20Balance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ERC20TotalSupply` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ERC20Balance" DROP CONSTRAINT "ERC20Balance_contractId_fkey";

-- DropForeignKey
ALTER TABLE "ERC20TotalSupply" DROP CONSTRAINT "ERC20TotalSupply_contractId_fkey";

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "logIndex" INTEGER,
ADD COLUMN     "transactionIndex" INTEGER,
ALTER COLUMN "blockNumber" DROP NOT NULL;

-- DropTable
DROP TABLE "ERC20Balance";

-- DropTable
DROP TABLE "ERC20TotalSupply";
