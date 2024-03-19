/*
  Warnings:

  - You are about to drop the `MerkleTreeLeaf` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MerkleTreeLeaf" DROP CONSTRAINT "MerkleTreeLeaf_treeId_fkey";

-- DropTable
DROP TABLE "MerkleTreeLeaf";
