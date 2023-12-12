-- CreateTable
CREATE TABLE "AnonSet" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "merkleRoot" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,

    CONSTRAINT "AnonSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddressWithMerkleProof" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "anonSetId" TEXT,
    "address" TEXT NOT NULL,
    "path" TEXT[],
    "pathIndices" INTEGER[],

    CONSTRAINT "AddressWithMerkleProof_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AddressWithMerkleProof" ADD CONSTRAINT "AddressWithMerkleProof_anonSetId_fkey" FOREIGN KEY ("anonSetId") REFERENCES "AnonSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
