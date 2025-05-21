-- DropIndex
-- DROP INDEX "idx_movimiento_estado_recepcion";

-- CreateTable
CREATE TABLE "CajaMayorMovimiento" (
    "id" SERIAL NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "operacionId" INTEGER NOT NULL,
    "moneda" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "esIngreso" BOOLEAN NOT NULL,
    "saldoAnterior" DECIMAL(15,2) NOT NULL,
    "saldoActual" DECIMAL(15,2) NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    "valeId" TEXT,
    "cambioId" TEXT,
    "usoDevolucionId" INTEGER,
    "depositoId" TEXT,
    "pagoServicioId" INTEGER,
    "retiroId" INTEGER,

    CONSTRAINT "CajaMayorMovimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Retiro" (
    "id" SERIAL NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "responsableId" INTEGER NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "moneda" TEXT NOT NULL,
    "fechaRetiro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroComprobante" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Retiro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CajaMayorMovimiento_tipo_operacionId_idx" ON "CajaMayorMovimiento"("tipo", "operacionId");

-- CreateIndex
CREATE INDEX "CajaMayorMovimiento_fechaHora_idx" ON "CajaMayorMovimiento"("fechaHora");

-- CreateIndex
CREATE INDEX "CajaMayorMovimiento_moneda_idx" ON "CajaMayorMovimiento"("moneda");

-- CreateIndex
CREATE INDEX "CajaMayorMovimiento_usuarioId_idx" ON "CajaMayorMovimiento"("usuarioId");

-- AddForeignKey
ALTER TABLE "CajaMayorMovimiento" ADD CONSTRAINT "CajaMayorMovimiento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CajaMayorMovimiento" ADD CONSTRAINT "CajaMayorMovimiento_valeId_fkey" FOREIGN KEY ("valeId") REFERENCES "Vale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CajaMayorMovimiento" ADD CONSTRAINT "CajaMayorMovimiento_cambioId_fkey" FOREIGN KEY ("cambioId") REFERENCES "CambioMoneda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CajaMayorMovimiento" ADD CONSTRAINT "CajaMayorMovimiento_usoDevolucionId_fkey" FOREIGN KEY ("usoDevolucionId") REFERENCES "uso_devolucion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CajaMayorMovimiento" ADD CONSTRAINT "CajaMayorMovimiento_depositoId_fkey" FOREIGN KEY ("depositoId") REFERENCES "DepositoBancario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CajaMayorMovimiento" ADD CONSTRAINT "CajaMayorMovimiento_pagoServicioId_fkey" FOREIGN KEY ("pagoServicioId") REFERENCES "pagos_servicios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CajaMayorMovimiento" ADD CONSTRAINT "CajaMayorMovimiento_retiroId_fkey" FOREIGN KEY ("retiroId") REFERENCES "Retiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retiro" ADD CONSTRAINT "Retiro_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retiro" ADD CONSTRAINT "Retiro_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
