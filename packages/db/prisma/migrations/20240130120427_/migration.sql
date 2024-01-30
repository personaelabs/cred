/*
  Warnings:

  - Added the required column `groupId` to the `OAuth` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OAuth" ADD COLUMN     "groupId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "OAuth" ADD CONSTRAINT "OAuth_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
