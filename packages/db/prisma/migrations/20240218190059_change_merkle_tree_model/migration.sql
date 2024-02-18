/*
  Warnings:

  - The primary key for the `FidAttestation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `merkleRoot` on the `FidAttestation` table. All the data in the column will be lost.
  - The primary key for the `MerkleProof` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `merkleRoot` on the `MerkleProof` table. All the data in the column will be lost.
  - The primary key for the `MerkleTree` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[merkleRoot,groupId,blockNumber]` on the table `MerkleTree` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `treeId` to the `FidAttestation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `treeId` to the `MerkleProof` table without a default value. This is not possible if the table is not empty.
  - Made the column `blockNumber` on table `MerkleTree` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "FidAttestation" DROP CONSTRAINT "FidAttestation_merkleRoot_fkey";

-- DropForeignKey
ALTER TABLE "MerkleProof" DROP CONSTRAINT "MerkleProof_merkleRoot_fkey";

-- AlterTable
ALTER TABLE "FidAttestation" DROP CONSTRAINT "FidAttestation_pkey",
DROP COLUMN "merkleRoot",
ADD COLUMN     "treeId" INTEGER NOT NULL,
ADD CONSTRAINT "FidAttestation_pkey" PRIMARY KEY ("fid", "treeId");

-- AlterTable
ALTER TABLE "MerkleProof" DROP CONSTRAINT "MerkleProof_pkey",
DROP COLUMN "merkleRoot",
ADD COLUMN     "treeId" INTEGER NOT NULL,
ADD CONSTRAINT "MerkleProof_pkey" PRIMARY KEY ("treeId", "address");

-- AlterTable
ALTER TABLE "MerkleTree" DROP CONSTRAINT "MerkleTree_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "blockNumber" SET NOT NULL,
ALTER COLUMN "blockNumber" SET DEFAULT 0,
ADD CONSTRAINT "MerkleTree_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "MerkleTree_merkleRoot_groupId_blockNumber_key" ON "MerkleTree"("merkleRoot", "groupId", "blockNumber");

-- AddForeignKey
ALTER TABLE "FidAttestation" ADD CONSTRAINT "FidAttestation_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "MerkleTree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerkleProof" ADD CONSTRAINT "MerkleProof_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "MerkleTree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
