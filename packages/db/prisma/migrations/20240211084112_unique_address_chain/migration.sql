/*
  Warnings:

  - A unique constraint covering the columns `[address,chain]` on the table `Contract` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Contract_address_chain_key" ON "Contract"("address", "chain");
