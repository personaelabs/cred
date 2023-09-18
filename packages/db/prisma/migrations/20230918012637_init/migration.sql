-- CreateTable
CREATE TABLE "TreeNode" (
    "pubkey" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "path" TEXT[],
    "indices" TEXT[],
    "root" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Tree" (
    "root" TEXT NOT NULL,
    "blockHeight" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CachedEOA" (
    "address" TEXT NOT NULL,
    "pubkey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CachedEOA_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "CachedCode" (
    "address" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CachedCode_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Gruop" (
    "name" TEXT NOT NULL,
    "root" TEXT NOT NULL,
    "blockHeight" INTEGER NOT NULL,

    CONSTRAINT "Gruop_pkey" PRIMARY KEY ("name")
);

-- CreateIndex
CREATE UNIQUE INDEX "TreeNode_pubkey_root_key" ON "TreeNode"("pubkey", "root");

-- CreateIndex
CREATE UNIQUE INDEX "Tree_root_blockHeight_key" ON "Tree"("root", "blockHeight");

-- CreateIndex
CREATE UNIQUE INDEX "CachedEOA_pubkey_key" ON "CachedEOA"("pubkey");

-- CreateIndex
CREATE UNIQUE INDEX "Gruop_root_blockHeight_key" ON "Gruop"("root", "blockHeight");
