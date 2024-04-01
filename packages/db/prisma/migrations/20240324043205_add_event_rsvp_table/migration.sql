-- CreateTable
CREATE TABLE "EventRSVPs" (
    "id" SERIAL NOT NULL,
    "event" TEXT NOT NULL,
    "fid" INTEGER NOT NULL,
    "attending" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRSVPs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventRSVPs_event_fid_key" ON "EventRSVPs"("event", "fid");
