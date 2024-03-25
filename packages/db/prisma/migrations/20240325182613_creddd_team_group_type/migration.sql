/*
  Warnings:

  - The values [Static] on the enum `GroupType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GroupType_new" AS ENUM ('CredddTeam', 'EarlyHolder', 'Whale', 'AllHolders', 'Ticker');
ALTER TABLE "Group" ALTER COLUMN "typeId" TYPE "GroupType_new" USING ("typeId"::text::"GroupType_new");
ALTER TYPE "GroupType" RENAME TO "GroupType_old";
ALTER TYPE "GroupType_new" RENAME TO "GroupType";
DROP TYPE "GroupType_old";
COMMIT;
