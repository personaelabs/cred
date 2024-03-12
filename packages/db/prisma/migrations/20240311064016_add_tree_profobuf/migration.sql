/*
  Warnings:

  - You are about to drop the column `layers` on the `MerkleTree2` table. All the data in the column will be lost.
  - Added the required column `treeProtoBuf` to the `MerkleTree2` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MerkleTree2" DROP COLUMN "layers",
ADD COLUMN     "treeProtoBuf" BYTEA NOT NULL;
