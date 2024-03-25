/*
  Warnings:

  - A unique constraint covering the columns `[id,typeId,contractInputs]` on the table `Group` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Group_typeId_contractInputs_key";

-- CreateIndex
CREATE UNIQUE INDEX "Group_id_typeId_contractInputs_key" ON "Group"("id", "typeId", "contractInputs");
