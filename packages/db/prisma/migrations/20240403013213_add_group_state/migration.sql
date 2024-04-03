-- CreateEnum
CREATE TYPE "GroupState" AS ENUM ('Recordable', 'Unrecordable');

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "state" "GroupState" NOT NULL DEFAULT 'Recordable';
