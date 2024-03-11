-- CreateTable
CREATE TABLE "MerkleTreeLeaf" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerkleTreeLeaf_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerkleTreeLeaf_groupId_blockNumber_address_key" ON "MerkleTreeLeaf"("groupId", "blockNumber", "address");
