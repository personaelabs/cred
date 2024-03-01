-- CreateTable
CREATE TABLE "MintLog" (
    "fid" INTEGER NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MintLog_pkey" PRIMARY KEY ("fid","tokenId")
);
