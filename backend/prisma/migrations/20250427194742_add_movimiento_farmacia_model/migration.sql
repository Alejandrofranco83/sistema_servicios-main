-- CreateTable
CREATE TABLE "movimientos_farmacia" (
    "id" SERIAL NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL,
    "tipo_movimiento" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "movimiento_origen_id" INTEGER,
    "movimiento_origen_tipo" TEXT,
    "monto" DECIMAL(15,2) NOT NULL,
    "moneda_codigo" VARCHAR(3) NOT NULL,
    "estado" TEXT NOT NULL,
    "usuario_id" INTEGER,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimientos_farmacia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movimientos_farmacia_fecha_hora_idx" ON "movimientos_farmacia"("fecha_hora");

-- CreateIndex
CREATE INDEX "movimientos_farmacia_tipo_movimiento_idx" ON "movimientos_farmacia"("tipo_movimiento");

-- CreateIndex
CREATE INDEX "movimientos_farmacia_estado_idx" ON "movimientos_farmacia"("estado");

-- CreateIndex
CREATE INDEX "movimientos_farmacia_usuario_id_idx" ON "movimientos_farmacia"("usuario_id");

-- CreateIndex
CREATE INDEX "movimientos_farmacia_movimiento_origen_id_movimiento_origen_idx" ON "movimientos_farmacia"("movimiento_origen_id", "movimiento_origen_tipo");

-- AddForeignKey
ALTER TABLE "movimientos_farmacia" ADD CONSTRAINT "movimientos_farmacia_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
