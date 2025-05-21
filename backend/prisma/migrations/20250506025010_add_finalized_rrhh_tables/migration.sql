-- CreateTable
CREATE TABLE "resumenes_mes_rrhh" (
    "id" SERIAL NOT NULL,
    "persona_id" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "fecha_finalizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizado" BOOLEAN NOT NULL DEFAULT true,
    "usuario_finaliza_id" INTEGER NOT NULL,
    "usuario_reabre_id" INTEGER,
    "fecha_reapertura" TIMESTAMP(3),
    "cotizaciones_usadas" JSONB,
    "total_gs" DECIMAL(15,2) NOT NULL,
    "total_usd" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_brl" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_final_gs" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumenes_mes_rrhh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_rrhh_finalizados" (
    "id" SERIAL NOT NULL,
    "resumen_mes_id" INTEGER NOT NULL,
    "movimiento_orig_id" INTEGER,
    "persona_id" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "observacion" TEXT,
    "moneda" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "monto_convertido_gs" DECIMAL(15,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimientos_rrhh_finalizados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resumenes_mes_rrhh_persona_id_idx" ON "resumenes_mes_rrhh"("persona_id");

-- CreateIndex
CREATE INDEX "resumenes_mes_rrhh_mes_anio_idx" ON "resumenes_mes_rrhh"("mes", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "resumenes_mes_rrhh_persona_id_mes_anio_key" ON "resumenes_mes_rrhh"("persona_id", "mes", "anio");

-- CreateIndex
CREATE INDEX "movimientos_rrhh_finalizados_resumen_mes_id_idx" ON "movimientos_rrhh_finalizados"("resumen_mes_id");

-- CreateIndex
CREATE INDEX "movimientos_rrhh_finalizados_persona_id_idx" ON "movimientos_rrhh_finalizados"("persona_id");

-- CreateIndex
CREATE INDEX "movimientos_rrhh_finalizados_mes_anio_idx" ON "movimientos_rrhh_finalizados"("mes", "anio");

-- AddForeignKey
ALTER TABLE "resumenes_mes_rrhh" ADD CONSTRAINT "resumenes_mes_rrhh_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumenes_mes_rrhh" ADD CONSTRAINT "resumenes_mes_rrhh_usuario_finaliza_id_fkey" FOREIGN KEY ("usuario_finaliza_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumenes_mes_rrhh" ADD CONSTRAINT "resumenes_mes_rrhh_usuario_reabre_id_fkey" FOREIGN KEY ("usuario_reabre_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_rrhh_finalizados" ADD CONSTRAINT "movimientos_rrhh_finalizados_resumen_mes_id_fkey" FOREIGN KEY ("resumen_mes_id") REFERENCES "resumenes_mes_rrhh"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_rrhh_finalizados" ADD CONSTRAINT "movimientos_rrhh_finalizados_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
