/*
  Warnings:

  - The primary key for the `ProcessedCast` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `action_details` on the `ProcessedCast` table. All the data in the column will be lost.
  - You are about to drop the column `castCreated_at` on the `ProcessedCast` table. All the data in the column will be lost.
  - You are about to drop the column `cast_id` on the `ProcessedCast` table. All the data in the column will be lost.
  - You are about to drop the column `last_updated` on the `ProcessedCast` table. All the data in the column will be lost.
  - You are about to drop the column `processed_time` on the `ProcessedCast` table. All the data in the column will be lost.
  - Added the required column `actionDetails` to the `ProcessedCast` table without a default value. This is not possible if the table is not empty.
  - Added the required column `castCreatedAt` to the `ProcessedCast` table without a default value. This is not possible if the table is not empty.
  - Added the required column `castId` to the `ProcessedCast` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ProcessedCast` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProcessedCast" DROP CONSTRAINT "ProcessedCast_pkey",
DROP COLUMN "action_details",
DROP COLUMN "castCreated_at",
DROP COLUMN "cast_id",
DROP COLUMN "last_updated",
DROP COLUMN "processed_time",
ADD COLUMN     "actionDetails" TEXT NOT NULL,
ADD COLUMN     "castCreatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "castId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "processedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "ProcessedCast_pkey" PRIMARY KEY ("castId");
