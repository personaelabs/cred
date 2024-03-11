/*
  Warnings:

  - You are about to drop the column `merkleTree2Id` on the `FidAttestation` table. All the data in the column will be lost.
  - You are about to drop the `MerkleProof` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MerkleTree2` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `treeProtoBuf` to the `MerkleTree` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FidAttestation" DROP CONSTRAINT "FidAttestation_merkleTree2Id_fkey";

-- DropForeignKey
ALTER TABLE "MerkleProof" DROP CONSTRAINT "MerkleProof_treeId_fkey";

-- DropForeignKey
ALTER TABLE "MerkleTree2" DROP CONSTRAINT "MerkleTree2_groupId_fkey";

-- AlterTable
ALTER TABLE "FidAttestation" DROP COLUMN "merkleTree2Id";

-- AlterTable
ALTER TABLE "MerkleTree" ADD COLUMN     "treeProtoBuf" BYTEA NOT NULL;

-- DropTable
DROP TABLE "MerkleProof";

-- DropTable
DROP TABLE "MerkleTree2";
