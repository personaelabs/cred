-- AlterTable
ALTER TABLE "MerkleTree" ADD COLUMN     "bloomNumBits" INTEGER,
ADD COLUMN     "bloomNumHashes" INTEGER,
ADD COLUMN     "bloomSipKeys" BYTEA[];
