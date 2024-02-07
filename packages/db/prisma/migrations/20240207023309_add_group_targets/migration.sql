/*
  Warnings:

  - You are about to drop the column `logo` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `requirements` on the `Group` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "targetGroups" TEXT[];

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "logo",
DROP COLUMN "requirements";
