/*
  Warnings:

  - A unique constraint covering the columns `[id,address,chain]` on the table `Contract` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Contract_address_chain_key";

-- AlterTable
ALTER TABLE "Contract" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Contract_id_seq";

-- AlterTable
ALTER TABLE "Group" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Group_id_seq";

-- CreateIndex
CREATE UNIQUE INDEX "Contract_id_address_chain_key" ON "Contract"("id", "address", "chain");
