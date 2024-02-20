/*
  Warnings:

  - Added the required column `hash` to the `ProcessedCast` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProcessedCast" ADD COLUMN     "hash" TEXT NOT NULL;
