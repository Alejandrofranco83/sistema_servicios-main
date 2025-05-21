-- CreateTable
CREATE TABLE "movimientos_rrhh" (
    "id" SERIAL NOT NULL,
    "persona_id" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "observacion" TEXT,
    "moneda" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimientos_rrhh_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movimientos_rrhh_persona_id_anio_mes_idx" ON "movimientos_rrhh"("persona_id", "anio", "mes");

-- CreateIndex
CREATE INDEX "movimientos_rrhh_usuario_id_idx" ON "movimientos_rrhh"("usuario_id");

-- AddForeignKey
ALTER TABLE "movimientos_rrhh" ADD CONSTRAINT "movimientos_rrhh_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_rrhh" ADD CONSTRAINT "movimientos_rrhh_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
