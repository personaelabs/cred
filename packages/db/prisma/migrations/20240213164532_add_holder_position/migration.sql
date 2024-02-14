/*
  Warnings:

  - You are about to drop the `GroupContractSpec` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `blockNumber` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "GroupContractSpec" DROP CONSTRAINT "GroupContractSpec_contractId_fkey";

-- DropForeignKey
ALTER TABLE "GroupContractSpec" DROP CONSTRAINT "GroupContractSpec_groupId_fkey";

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "targetGroups" TEXT[];

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "blockNumber" BIGINT NOT NULL;

-- DropTable
DROP TABLE "GroupContractSpec";

-- CreateTable
CREATE TABLE "ERC20HolderPosition" (
    "address" TEXT NOT NULL,
    "contractId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ERC20HolderPosition_pkey" PRIMARY KEY ("address","contractId")
);

-- CreateIndex
CREATE INDEX "ERC20HolderPosition_position_idx" ON "ERC20HolderPosition"("position");

-- AddForeignKey
ALTER TABLE "ERC20HolderPosition" ADD CONSTRAINT "ERC20HolderPosition_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
