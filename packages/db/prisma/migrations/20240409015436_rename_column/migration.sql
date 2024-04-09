/*
  Warnings:

  - You are about to drop the column `secret` on the `PaymentAddress` table. All the data in the column will be lost.
  - Added the required column `encryptedSecret` to the `PaymentAddress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PaymentAddress" DROP COLUMN "secret",
ADD COLUMN     "encryptedSecret" BYTEA NOT NULL;
