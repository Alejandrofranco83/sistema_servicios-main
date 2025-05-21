-- CreateTable
CREATE TABLE "SueldoMinimo" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor" DECIMAL(10,2) NOT NULL,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SueldoMinimo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SueldoMinimo" ADD CONSTRAINT "SueldoMinimo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
