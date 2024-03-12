/*
  Warnings:

  - A unique constraint covering the columns `[groupId,blockNumber]` on the table `MerkleTree` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "MerkleTree_merkleRoot_groupId_blockNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "MerkleTree_groupId_blockNumber_key" ON "MerkleTree"("groupId", "blockNumber");
