-- CreateTable
CREATE TABLE "MembershipProof" (
    "proofHash" TEXT NOT NULL,
    "proof" TEXT NOT NULL,
    "publicInput" TEXT NOT NULL,

    CONSTRAINT "MembershipProof_pkey" PRIMARY KEY ("proofHash")
);

-- CreateTable
CREATE TABLE "Gruop" (
    "name" TEXT NOT NULL,
    "root" TEXT NOT NULL,
    "blockHeight" INTEGER NOT NULL,

    CONSTRAINT "Gruop_pkey" PRIMARY KEY ("name")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gruop_root_blockHeight_key" ON "Gruop"("root", "blockHeight");
