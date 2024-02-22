/*
  Warnings:

  - The primary key for the `ProcessedCast` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `castCreatedAt` on the `ProcessedCast` table. All the data in the column will be lost.
  - You are about to drop the column `castId` on the `ProcessedCast` table. All the data in the column will be lost.
  - Added the required column `timestamp` to the `ProcessedCast` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProcessedCast" DROP CONSTRAINT "ProcessedCast_pkey",
DROP COLUMN "castCreatedAt",
DROP COLUMN "castId",
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "ProcessedCast_pkey" PRIMARY KEY ("hash");
