/*
  Warnings:

  - You are about to drop the column `symbol` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `targetGroupIds` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `handle` on the `Group` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[typeId,contractInputs]` on the table `Group` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Group_handle_key";

-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "symbol",
DROP COLUMN "targetGroupIds";

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "handle",
ADD COLUMN     "contractInputs" INTEGER[];

-- CreateIndex
CREATE UNIQUE INDEX "Group_typeId_contractInputs_key" ON "Group"("typeId", "contractInputs");
