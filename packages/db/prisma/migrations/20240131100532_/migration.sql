/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Verification` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `publicKey` to the `OAuth` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Verification" DROP CONSTRAINT "Verification_merkleRoot_fkey";

-- DropForeignKey
ALTER TABLE "Verification" DROP CONSTRAINT "Verification_username_fkey";

-- AlterTable
ALTER TABLE "OAuth" ADD COLUMN     "publicKey" TEXT NOT NULL;

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "Verification";

-- CreateTable
CREATE TABLE "Attestation" (
    "id" SERIAL NOT NULL,
    "signerPublicKey" TEXT NOT NULL,
    "merkleRoot" TEXT NOT NULL,
    "proof" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attestation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signer" (
    "publicKey" TEXT NOT NULL,
    "twitterUsername" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Signer_pkey" PRIMARY KEY ("publicKey")
);

-- CreateTable
CREATE TABLE "TwitterUser" (
    "username" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "accessTokenSecret" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwitterUser_pkey" PRIMARY KEY ("username")
);

-- CreateIndex
CREATE UNIQUE INDEX "TwitterUser_accessToken_key" ON "TwitterUser"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "TwitterUser_accessTokenSecret_key" ON "TwitterUser"("accessTokenSecret");

-- AddForeignKey
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_signerPublicKey_fkey" FOREIGN KEY ("signerPublicKey") REFERENCES "Signer"("publicKey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_merkleRoot_fkey" FOREIGN KEY ("merkleRoot") REFERENCES "MerkleTree"("merkleRoot") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signer" ADD CONSTRAINT "Signer_twitterUsername_fkey" FOREIGN KEY ("twitterUsername") REFERENCES "TwitterUser"("username") ON DELETE SET NULL ON UPDATE CASCADE;
