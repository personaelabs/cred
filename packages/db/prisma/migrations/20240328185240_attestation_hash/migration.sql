/*
  Warnings:

  - A unique constraint covering the columns `[hash]` on the table `FidAttestation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "FidAttestation" ADD COLUMN     "hash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FidAttestation_hash_key" ON "FidAttestation"("hash");
