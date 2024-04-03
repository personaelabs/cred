/*
  Warnings:

  - The primary key for the `IntrinsicCreddd` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `hash` on the `IntrinsicCreddd` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "IntrinsicCreddd" DROP CONSTRAINT "IntrinsicCreddd_pkey",
DROP COLUMN "hash",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "IntrinsicCreddd_pkey" PRIMARY KEY ("id");
