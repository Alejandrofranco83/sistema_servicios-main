-- CreateTable
CREATE TABLE "Sueldo" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sueldo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sueldo_mes_anio_idx" ON "Sueldo"("mes", "anio");

-- CreateIndex
CREATE INDEX "Sueldo_personaId_idx" ON "Sueldo"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "Sueldo_personaId_mes_anio_key" ON "Sueldo"("personaId", "mes", "anio");

-- AddForeignKey
ALTER TABLE "Sueldo" ADD CONSTRAINT "Sueldo_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
