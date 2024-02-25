/*
  Warnings:

  - You are about to drop the `MerkleProof` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MerkleProof" DROP CONSTRAINT "MerkleProof_treeId_fkey";

-- AlterTable
ALTER TABLE "MerkleTree" ADD COLUMN     "merkleProofs" BYTEA[];

-- DropTable
DROP TABLE "MerkleProof";
