-- CreateTable
CREATE TABLE "ERC20TotalSupply" (
    "contractId" INTEGER NOT NULL,
    "totalSupply" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ERC20TotalSupply_pkey" PRIMARY KEY ("contractId")
);

-- CreateTable
CREATE TABLE "ERC20Balance" (
    "contractId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "balance" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ERC20Balance_pkey" PRIMARY KEY ("contractId","address")
);

-- AddForeignKey
ALTER TABLE "ERC20TotalSupply" ADD CONSTRAINT "ERC20TotalSupply_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ERC20Balance" ADD CONSTRAINT "ERC20Balance_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
