/*
  Warnings:

  - Added the required column `castCreated_at` to the `ProcessedCast` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProcessedCast" ADD COLUMN     "castCreated_at" TIMESTAMP(3) NOT NULL;
