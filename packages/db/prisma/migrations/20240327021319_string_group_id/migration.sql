/*
  Warnings:

  - The primary key for the `Group` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "MerkleTree" DROP CONSTRAINT "MerkleTree_groupId_fkey";

-- AlterTable
ALTER TABLE "Group" DROP CONSTRAINT "Group_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Group_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MerkleTree" ALTER COLUMN "groupId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "MerkleTree" ADD CONSTRAINT "MerkleTree_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
