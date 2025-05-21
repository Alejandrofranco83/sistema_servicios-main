-- Crear tabla para WepaUsdConfig
CREATE TABLE IF NOT EXISTS "wepa_usd_config" (
  "id" SERIAL PRIMARY KEY,
  "cuenta_bancaria_id" INTEGER NOT NULL,
  "limite_credito" DECIMAL(18, 2) NOT NULL,
  "fecha_inicio_vigencia" DATE NOT NULL,
  "fecha_fin_vigencia" DATE NOT NULL,
  "nombre_archivo_contrato" TEXT,
  "path_archivo_contrato" TEXT,
  "fecha_creacion" TIMESTAMP NOT NULL DEFAULT NOW(),
  "usuario_id" INTEGER NOT NULL,
  FOREIGN KEY ("cuenta_bancaria_id") REFERENCES "CuentaBancaria"("id"),
  FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id")
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS "wepa_usd_config_cuenta_bancaria_id_idx" ON "wepa_usd_config"("cuenta_bancaria_id");
CREATE INDEX IF NOT EXISTS "wepa_usd_config_usuario_id_idx" ON "wepa_usd_config"("usuario_id"); 