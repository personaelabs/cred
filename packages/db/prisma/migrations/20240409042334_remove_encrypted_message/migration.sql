/*
  Warnings:

  - You are about to drop the column `encryptedSecret` on the `PaymentAddress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PaymentAddress" DROP COLUMN "encryptedSecret";
