-- CreateTable
CREATE TABLE "AquipagoConfig" (
    "id" SERIAL NOT NULL,
    "cuentaBancariaId" INTEGER NOT NULL,
    "limiteCredito" DECIMAL(18,0) NOT NULL,
    "fechaInicioVigencia" DATE NOT NULL,
    "fechaFinVigencia" DATE NOT NULL,
    "nombreArchivoContrato" TEXT,
    "pathArchivoContrato" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "AquipagoConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AquipagoConfig_cuentaBancariaId_idx" ON "AquipagoConfig"("cuentaBancariaId");

-- CreateIndex
CREATE INDEX "AquipagoConfig_usuarioId_idx" ON "AquipagoConfig"("usuarioId");

-- AddForeignKey
ALTER TABLE "AquipagoConfig" ADD CONSTRAINT "AquipagoConfig_cuentaBancariaId_fkey" FOREIGN KEY ("cuentaBancariaId") REFERENCES "CuentaBancaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AquipagoConfig" ADD CONSTRAINT "AquipagoConfig_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
