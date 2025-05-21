-- CreateTable
CREATE TABLE "Gasto" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'GS',
    "categoriaId" INTEGER NOT NULL,
    "subcategoriaId" INTEGER,
    "sucursalId" INTEGER,
    "comprobante" TEXT,
    "observaciones" TEXT,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gasto_categoriaId_idx" ON "Gasto"("categoriaId");

-- CreateIndex
CREATE INDEX "Gasto_subcategoriaId_idx" ON "Gasto"("subcategoriaId");

-- CreateIndex
CREATE INDEX "Gasto_sucursalId_idx" ON "Gasto"("sucursalId");

-- CreateIndex
CREATE INDEX "Gasto_usuarioId_idx" ON "Gasto"("usuarioId");

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaGasto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_subcategoriaId_fkey" FOREIGN KEY ("subcategoriaId") REFERENCES "SubcategoriaGasto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
