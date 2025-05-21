/*
  Warnings:

  - You are about to drop the column `personaId` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `rolId` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `Usuario` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[persona_id]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rol_id` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_personaId_fkey";

-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_rolId_fkey";

-- DropIndex
DROP INDEX "Usuario_personaId_key";

-- AlterTable
ALTER TABLE "CuentaBancaria" ALTER COLUMN "tipo" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MovimientoCaja" ADD COLUMN     "usuarioId" INTEGER;

-- AlterTable
ALTER TABLE "OperacionBancaria" ADD COLUMN     "usuarioId" INTEGER;

-- AlterTable
ALTER TABLE "Pago" ADD COLUMN     "usuarioId" INTEGER;

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "personaId",
DROP COLUMN "rolId",
DROP COLUMN "tipo",
ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "persona_id" INTEGER,
ADD COLUMN     "rol_id" INTEGER NOT NULL,
ALTER COLUMN "password" DROP DEFAULT,
ALTER COLUMN "nombre" DROP NOT NULL;

-- CreateTable
CREATE TABLE "wepa_usd_config" (
    "id" SERIAL NOT NULL,
    "cuenta_bancaria_id" INTEGER NOT NULL,
    "limite_credito" DECIMAL(18,2) NOT NULL,
    "fecha_inicio_vigencia" DATE NOT NULL,
    "fecha_fin_vigencia" DATE NOT NULL,
    "nombre_archivo_contrato" TEXT,
    "path_archivo_contrato" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "wepa_usd_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wepa_usd_config_cuenta_bancaria_id_idx" ON "wepa_usd_config"("cuenta_bancaria_id");

-- CreateIndex
CREATE INDEX "wepa_usd_config_usuario_id_idx" ON "wepa_usd_config"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_persona_id_key" ON "Usuario"("persona_id");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "Rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCaja" ADD CONSTRAINT "MovimientoCaja_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperacionBancaria" ADD CONSTRAINT "OperacionBancaria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wepa_usd_config" ADD CONSTRAINT "wepa_usd_config_cuenta_bancaria_id_fkey" FOREIGN KEY ("cuenta_bancaria_id") REFERENCES "CuentaBancaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wepa_usd_config" ADD CONSTRAINT "wepa_usd_config_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
