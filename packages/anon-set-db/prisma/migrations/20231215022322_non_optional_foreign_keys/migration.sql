/*
  Warnings:

  - Made the column `anonSetMerkleTreeMerkleRoot` on table `AddressWithMerkleProof` required. This step will fail if there are existing NULL values in that column.
  - Made the column `anonSetId` on table `AnonSetMerkleTree` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "AddressWithMerkleProof" DROP CONSTRAINT "AddressWithMerkleProof_anonSetMerkleTreeMerkleRoot_fkey";

-- DropForeignKey
ALTER TABLE "AnonSetMerkleTree" DROP CONSTRAINT "AnonSetMerkleTree_anonSetId_fkey";

-- AlterTable
ALTER TABLE "AddressWithMerkleProof" ALTER COLUMN "anonSetMerkleTreeMerkleRoot" SET NOT NULL;

-- AlterTable
ALTER TABLE "AnonSetMerkleTree" ALTER COLUMN "anonSetId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "AnonSetMerkleTree" ADD CONSTRAINT "AnonSetMerkleTree_anonSetId_fkey" FOREIGN KEY ("anonSetId") REFERENCES "AnonSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddressWithMerkleProof" ADD CONSTRAINT "AddressWithMerkleProof_anonSetMerkleTreeMerkleRoot_fkey" FOREIGN KEY ("anonSetMerkleTreeMerkleRoot") REFERENCES "AnonSetMerkleTree"("merkleRoot") ON DELETE RESTRICT ON UPDATE CASCADE;
