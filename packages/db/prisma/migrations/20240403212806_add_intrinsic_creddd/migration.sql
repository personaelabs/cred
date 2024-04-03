-- CreateTable
CREATE TABLE "IntrinsicCreddd" (
    "hash" TEXT NOT NULL,
    "fid" INTEGER NOT NULL,
    "treeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntrinsicCreddd_pkey" PRIMARY KEY ("hash")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntrinsicCreddd_fid_treeId_key" ON "IntrinsicCreddd"("fid", "treeId");

-- AddForeignKey
ALTER TABLE "IntrinsicCreddd" ADD CONSTRAINT "IntrinsicCreddd_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "MerkleTree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
