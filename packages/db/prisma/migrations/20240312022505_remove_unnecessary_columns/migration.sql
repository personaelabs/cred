/*
  Warnings:

  - You are about to drop the column `blockNumber` on the `MerkleTreeLeaf` table. All the data in the column will be lost.
  - You are about to drop the column `groupId` on the `MerkleTreeLeaf` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[treeId,address]` on the table `MerkleTreeLeaf` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "MerkleTreeLeaf_groupId_blockNumber_address_key";

-- AlterTable
ALTER TABLE "MerkleTreeLeaf" DROP COLUMN "blockNumber",
DROP COLUMN "groupId";

-- CreateIndex
CREATE UNIQUE INDEX "MerkleTreeLeaf_treeId_address_key" ON "MerkleTreeLeaf"("treeId", "address");
