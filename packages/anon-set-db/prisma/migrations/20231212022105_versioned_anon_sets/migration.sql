/*
  Warnings:

  - You are about to drop the column `anonSetId` on the `AddressWithMerkleProof` table. All the data in the column will be lost.
  - You are about to drop the column `merkleRoot` on the `AnonSet` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `AnonSet` table. All the data in the column will be lost.
  - Added the required column `name` to the `AnonSet` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AddressWithMerkleProof" DROP CONSTRAINT "AddressWithMerkleProof_anonSetId_fkey";

-- AlterTable
ALTER TABLE "AddressWithMerkleProof" DROP COLUMN "anonSetId",
ADD COLUMN     "anonSetMerkleTreeMerkleRoot" TEXT;

-- AlterTable
ALTER TABLE "AnonSet" DROP COLUMN "merkleRoot",
DROP COLUMN "metadata",
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "AnonSetMerkleTree" (
    "merkleRoot" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "anonSetId" TEXT,

    CONSTRAINT "AnonSetMerkleTree_pkey" PRIMARY KEY ("merkleRoot")
);

-- AddForeignKey
ALTER TABLE "AnonSetMerkleTree" ADD CONSTRAINT "AnonSetMerkleTree_anonSetId_fkey" FOREIGN KEY ("anonSetId") REFERENCES "AnonSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddressWithMerkleProof" ADD CONSTRAINT "AddressWithMerkleProof_anonSetMerkleTreeMerkleRoot_fkey" FOREIGN KEY ("anonSetMerkleTreeMerkleRoot") REFERENCES "AnonSetMerkleTree"("merkleRoot") ON DELETE SET NULL ON UPDATE CASCADE;
