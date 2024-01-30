/*
  Warnings:

  - You are about to drop the `MembershipProof` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('ERC20', 'ERC721', 'Other');

-- DropTable
DROP TABLE "MembershipProof";

-- CreateTable
CREATE TABLE "ERC721TransferEvent" (
    "blockNumber" BIGINT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "tokenId" BIGINT NOT NULL,
    "contractId" INTEGER NOT NULL DEFAULT 0,
    "transactionIndex" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ERC20TransferEvent" (
    "transactionIndex" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "contractId" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MerkleTree" (
    "merkleRoot" TEXT NOT NULL,
    "groupId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerkleTree_pkey" PRIMARY KEY ("merkleRoot")
);

-- CreateTable
CREATE TABLE "MerkleProof" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "path" TEXT[],
    "pathIndices" INTEGER[],
    "merkleRoot" TEXT NOT NULL,

    CONSTRAINT "MerkleProof_pkey" PRIMARY KEY ("merkleRoot","address")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "requirements" TEXT[],
    "logo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "username" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "merkleRoot" TEXT NOT NULL,
    "proof" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("username","publicKey")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ContractType" NOT NULL,
    "deployedBlock" BIGINT NOT NULL,
    "chain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "username" TEXT NOT NULL,
    "accessToken" TEXT,
    "accessTokenSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "OAuth" (
    "oAuthToken" TEXT NOT NULL,
    "oAuthSecret" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuth_pkey" PRIMARY KEY ("oAuthToken")
);

-- CreateIndex
CREATE INDEX "ERC721TransferEvent_to_idx" ON "ERC721TransferEvent"("to");

-- CreateIndex
CREATE INDEX "ERC721TransferEvent_from_idx" ON "ERC721TransferEvent"("from");

-- CreateIndex
CREATE INDEX "ERC721TransferEvent_contractId_idx" ON "ERC721TransferEvent"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "ERC721TransferEvent_blockNumber_transactionIndex_key" ON "ERC721TransferEvent"("blockNumber", "transactionIndex");

-- CreateIndex
CREATE INDEX "ERC20TransferEvent_to_idx" ON "ERC20TransferEvent"("to");

-- CreateIndex
CREATE INDEX "ERC20TransferEvent_from_idx" ON "ERC20TransferEvent"("from");

-- CreateIndex
CREATE INDEX "ERC20TransferEvent_contractId_idx" ON "ERC20TransferEvent"("contractId");

-- CreateIndex
CREATE INDEX "ERC20TransferEvent_blockNumber_idx" ON "ERC20TransferEvent"("blockNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ERC20TransferEvent_blockNumber_transactionIndex_key" ON "ERC20TransferEvent"("blockNumber", "transactionIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Group_handle_key" ON "Group"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_address_key" ON "Contract"("address");

-- CreateIndex
CREATE UNIQUE INDEX "User_accessToken_key" ON "User"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_accessTokenSecret_key" ON "User"("accessTokenSecret");

-- CreateIndex
CREATE UNIQUE INDEX "OAuth_oAuthSecret_key" ON "OAuth"("oAuthSecret");

-- AddForeignKey
ALTER TABLE "ERC721TransferEvent" ADD CONSTRAINT "ERC721TransferEvent_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ERC20TransferEvent" ADD CONSTRAINT "ERC20TransferEvent_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerkleTree" ADD CONSTRAINT "MerkleTree_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerkleProof" ADD CONSTRAINT "MerkleProof_merkleRoot_fkey" FOREIGN KEY ("merkleRoot") REFERENCES "MerkleTree"("merkleRoot") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_merkleRoot_fkey" FOREIGN KEY ("merkleRoot") REFERENCES "MerkleTree"("merkleRoot") ON DELETE RESTRICT ON UPDATE CASCADE;
