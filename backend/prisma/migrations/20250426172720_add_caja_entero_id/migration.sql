/*
  Warnings:

  - You are about to alter the column `guaranies` on the `saldo_persona` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to drop the `CajaMayorMovimiento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Retiro` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[cajaEnteroId]` on the table `Caja` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "CajaMayorMovimiento" DROP CONSTRAINT "CajaMayorMovimiento_cambioId_fkey";

-- DropForeignKey
ALTER TABLE "CajaMayorMovimiento" DROP CONSTRAINT "CajaMayorMovimiento_depositoId_fkey";

-- DropForeignKey
ALTER TABLE "CajaMayorMovimiento" DROP CONSTRAINT "CajaMayorMovimiento_pagoServicioId_fkey";

-- DropForeignKey
ALTER TABLE "CajaMayorMovimiento" DROP CONSTRAINT "CajaMayorMovimiento_retiroId_fkey";

-- DropForeignKey
ALTER TABLE "CajaMayorMovimiento" DROP CONSTRAINT "CajaMayorMovimiento_usoDevolucionId_fkey";

-- DropForeignKey
ALTER TABLE "CajaMayorMovimiento" DROP CONSTRAINT "CajaMayorMovimiento_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "CajaMayorMovimiento" DROP CONSTRAINT "CajaMayorMovimiento_valeId_fkey";

-- DropForeignKey
ALTER TABLE "Retiro" DROP CONSTRAINT "Retiro_responsableId_fkey";

-- DropForeignKey
ALTER TABLE "Retiro" DROP CONSTRAINT "Retiro_sucursalId_fkey";

-- AlterTable
ALTER TABLE "Caja" ADD COLUMN     "cajaEnteroId" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "pagos_servicios" ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "saldo_persona" ALTER COLUMN "guaranies" SET DEFAULT 0,
ALTER COLUMN "guaranies" SET DATA TYPE BIGINT;

-- DropTable
DROP TABLE "CajaMayorMovimiento";

-- DropTable
DROP TABLE "Retiro";

-- CreateIndex
CREATE UNIQUE INDEX "Caja_cajaEnteroId_key" ON "Caja"("cajaEnteroId");

-- AddForeignKey
ALTER TABLE "caja_mayor_movimientos" ADD CONSTRAINT "caja_mayor_movimientos_depositoId_fkey" FOREIGN KEY ("depositoId") REFERENCES "DepositoBancario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
