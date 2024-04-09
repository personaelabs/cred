-- CreateTable
CREATE TABLE "PaymentAddress" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "secret" BYTEA NOT NULL,
    "custodyAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAddress_pkey" PRIMARY KEY ("id")
);
