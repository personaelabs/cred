/*
  Warnings:

  - Made the column `accessToken` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `accessTokenSecret` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "accessToken" SET NOT NULL,
ALTER COLUMN "accessTokenSecret" SET NOT NULL;
