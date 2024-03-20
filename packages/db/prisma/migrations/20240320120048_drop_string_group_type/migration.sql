/*
  Warnings:

  - You are about to drop the column `targetGroups` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Group` table. All the data in the column will be lost.
  - Made the column `typeId` on table `Group` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "targetGroups";

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "type",
ALTER COLUMN "typeId" SET NOT NULL;
