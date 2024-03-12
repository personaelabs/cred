/*
  Warnings:

  - Added the required column `treeId` to the `MerkleTreeLeaf` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MerkleTreeLeaf" ADD COLUMN     "treeId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "MerkleTreeLeaf" ADD CONSTRAINT "MerkleTreeLeaf_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "MerkleTree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
