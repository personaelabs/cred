/*
  Warnings:

  - You are about to drop the column `targetGroups` on the `Contract` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "targetGroups";

-- CreateTable
CREATE TABLE "FidAttestation" (
    "fid" INTEGER NOT NULL,
    "attestation" BYTEA NOT NULL,
    "signInSig" BYTEA NOT NULL,
    "merkleRoot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FidAttestation_pkey" PRIMARY KEY ("fid","merkleRoot")
);

-- CreateTable
CREATE TABLE "GroupContractSpec" (
    "contractId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "rules" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupContractSpec_pkey" PRIMARY KEY ("contractId","groupId")
);

-- AddForeignKey
ALTER TABLE "FidAttestation" ADD CONSTRAINT "FidAttestation_merkleRoot_fkey" FOREIGN KEY ("merkleRoot") REFERENCES "MerkleTree"("merkleRoot") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupContractSpec" ADD CONSTRAINT "GroupContractSpec_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupContractSpec" ADD CONSTRAINT "GroupContractSpec_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
