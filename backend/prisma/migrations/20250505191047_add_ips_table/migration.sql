-- CreateTable
CREATE TABLE "PersonaIPS" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonaIPS_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonaIPS_personaId_idx" ON "PersonaIPS"("personaId");

-- AddForeignKey
ALTER TABLE "PersonaIPS" ADD CONSTRAINT "PersonaIPS_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
