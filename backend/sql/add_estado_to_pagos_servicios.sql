-- Añadir campo estado a la tabla pagos_servicios
ALTER TABLE "pagos_servicios" ADD COLUMN IF NOT EXISTS "estado" TEXT NOT NULL DEFAULT 'PENDIENTE';

-- Crear índice para facilitar búsquedas por estado
CREATE INDEX IF NOT EXISTS "pagos_servicios_estado_idx" ON "pagos_servicios"("estado");

-- Comentario explicativo
COMMENT ON COLUMN "pagos_servicios"."estado" IS 'Estado del pago de servicio (PENDIENTE, PROCESADO, ANULADO, etc.)'; 