/*
  Warnings:

  - Added the required column `msg` to the `MembershipProof` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MembershipProof` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MembershipProof" ADD COLUMN     "craetedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "msg" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
