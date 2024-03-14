-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('Static', 'EarlyHolder', 'Whale', 'AllHolders');

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "typeId" "GroupType";
