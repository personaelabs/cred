/*
  Warnings:

  - You are about to drop the `ERC20HolderPosition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ERC20TransferEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ERC721TransferEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ERC20HolderPosition" DROP CONSTRAINT "ERC20HolderPosition_contractId_fkey";

-- DropForeignKey
ALTER TABLE "ERC20TransferEvent" DROP CONSTRAINT "ERC20TransferEvent_contractId_fkey";

-- DropForeignKey
ALTER TABLE "ERC721TransferEvent" DROP CONSTRAINT "ERC721TransferEvent_contractId_fkey";

-- DropTable
DROP TABLE "ERC20HolderPosition";

-- DropTable
DROP TABLE "ERC20TransferEvent";

-- DropTable
DROP TABLE "ERC721TransferEvent";
