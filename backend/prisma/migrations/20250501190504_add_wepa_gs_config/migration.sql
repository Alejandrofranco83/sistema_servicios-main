-- CreateTable
CREATE TABLE "wepa_gs_config" (
    "id" SERIAL NOT NULL,
    "cuenta_bancaria_id" INTEGER NOT NULL,
    "limite_credito" DECIMAL(18,0) NOT NULL,
    "fecha_inicio_vigencia" DATE NOT NULL,
    "fecha_fin_vigencia" DATE NOT NULL,
    "nombre_archivo_contrato" TEXT,
    "path_archivo_contrato" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "wepa_gs_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wepa_gs_config_cuenta_bancaria_id_idx" ON "wepa_gs_config"("cuenta_bancaria_id");

-- CreateIndex
CREATE INDEX "wepa_gs_config_usuario_id_idx" ON "wepa_gs_config"("usuario_id");

-- AddForeignKey
ALTER TABLE "wepa_gs_config" ADD CONSTRAINT "wepa_gs_config_cuenta_bancaria_id_fkey" FOREIGN KEY ("cuenta_bancaria_id") REFERENCES "CuentaBancaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wepa_gs_config" ADD CONSTRAINT "wepa_gs_config_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
