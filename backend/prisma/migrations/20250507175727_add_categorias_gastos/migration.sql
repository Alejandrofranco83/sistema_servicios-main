-- CreateTable
CREATE TABLE "CategoriaGasto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoriaGasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubcategoriaGasto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubcategoriaGasto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaGasto_nombre_key" ON "CategoriaGasto"("nombre");

-- CreateIndex
CREATE INDEX "SubcategoriaGasto_categoriaId_idx" ON "SubcategoriaGasto"("categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "SubcategoriaGasto_nombre_categoriaId_key" ON "SubcategoriaGasto"("nombre", "categoriaId");

-- AddForeignKey
ALTER TABLE "SubcategoriaGasto" ADD CONSTRAINT "SubcategoriaGasto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaGasto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
