-- AlterTable
ALTER TABLE "FidAttestation" ADD COLUMN     "merkleTree2Id" INTEGER;

-- CreateTable
CREATE TABLE "MerkleTree2" (
    "id" SERIAL NOT NULL,
    "merkleRoot" TEXT NOT NULL,
    "groupId" INTEGER NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "layers" BYTEA[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerkleTree2_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerkleTree2_merkleRoot_groupId_blockNumber_key" ON "MerkleTree2"("merkleRoot", "groupId", "blockNumber");

-- AddForeignKey
ALTER TABLE "FidAttestation" ADD CONSTRAINT "FidAttestation_merkleTree2Id_fkey" FOREIGN KEY ("merkleTree2Id") REFERENCES "MerkleTree2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerkleTree2" ADD CONSTRAINT "MerkleTree2_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
