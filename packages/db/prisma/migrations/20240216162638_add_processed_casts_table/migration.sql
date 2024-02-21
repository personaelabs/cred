-- CreateTable
CREATE TABLE "ProcessedCast" (
    "cast_id" INTEGER NOT NULL,
    "processed_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "action_details" TEXT NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessedCast_pkey" PRIMARY KEY ("cast_id")
);
