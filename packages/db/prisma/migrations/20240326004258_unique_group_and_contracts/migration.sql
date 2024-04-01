/*
  Warnings:

  - You are about to drop the column `symbol` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `targetGroupIds` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `handle` on the `Group` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id,address,chain]` on the table `Contract` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,typeId,contractInputs]` on the table `Group` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "GroupType" ADD VALUE 'CredddTeam';

-- DropIndex
DROP INDEX "Contract_address_chain_key";

-- DropIndex
DROP INDEX "Group_handle_key";

-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "symbol",
DROP COLUMN "targetGroupIds",
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Contract_id_seq";

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "handle",
ADD COLUMN     "contractInputs" INTEGER[],
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Group_id_seq";

-- CreateIndex
CREATE UNIQUE INDEX "Contract_id_address_chain_key" ON "Contract"("id", "address", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "Group_id_typeId_contractInputs_key" ON "Group"("id", "typeId", "contractInputs");
