/*
  Warnings:

  - You are about to drop the column `msg` on the `MembershipProof` table. All the data in the column will be lost.
  - Added the required column `message` to the `MembershipProof` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MembershipProof" DROP COLUMN "msg",
ADD COLUMN     "message" TEXT NOT NULL;
