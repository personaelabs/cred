/*
  Warnings:

  - A unique constraint covering the columns `[blockNumber,transactionIndex,logIndex]` on the table `ERC20TransferEvent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[blockNumber,transactionIndex,logIndex]` on the table `ERC721TransferEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ERC20TransferEvent_blockNumber_transactionIndex_key";

-- DropIndex
DROP INDEX "ERC721TransferEvent_blockNumber_transactionIndex_key";

-- CreateIndex
CREATE UNIQUE INDEX "ERC20TransferEvent_blockNumber_transactionIndex_logIndex_key" ON "ERC20TransferEvent"("blockNumber", "transactionIndex", "logIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ERC721TransferEvent_blockNumber_transactionIndex_logIndex_key" ON "ERC721TransferEvent"("blockNumber", "transactionIndex", "logIndex");
